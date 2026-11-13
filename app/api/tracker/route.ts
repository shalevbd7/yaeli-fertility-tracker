import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { getTrackerAccess } from '@/lib/access';

/**
 * The tracker the caller may access: the owner's own tracker, or for an
 * approved partner the owner's tracker. Pending/unlinked partners get 403.
 */
async function resolveTrackerUserId(): Promise<
  { userId: string; error?: undefined } | { userId?: undefined; error: NextResponse }
> {
  const access = await getTrackerAccess();
  if (!access) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!access.trackerUserId) {
    return { error: NextResponse.json({ error: 'no-access', role: access.role }, { status: 403 }) };
  }
  return { userId: access.trackerUserId };
}

type TrackerLean = {
  hasActiveCycle?: boolean;
  cycleStartDate?: Date | null;
  stages?: unknown[];
  medications?: unknown[];
  completedTasks?: unknown;
  updatedAt?: Date | null;
};

function toResponseBody(doc: TrackerLean) {
  const completedTasks =
    doc.completedTasks instanceof Map
      ? Object.fromEntries(doc.completedTasks)
      : (doc.completedTasks ?? {});

  return {
    hasActiveCycle: doc.hasActiveCycle ?? false,
    cycleStartDate: doc.cycleStartDate ?? null,
    stages: doc.stages ?? [],
    medications: doc.medications ?? [],
    completedTasks,
    // Version stamp: the client must send it back as `baseUpdatedAt` on save.
    updatedAt: doc.updatedAt ?? null,
  };
}

function conflict() {
  return NextResponse.json({ error: 'conflict' }, { status: 409 });
}

export async function GET() {
  try {
    const resolved = await resolveTrackerUserId();
    if (resolved.error) return resolved.error;
    const userId = resolved.userId;

    await connectDB();

    const data = (await Tracker.findOne({ userId }).lean()) as TrackerLean | null;

    if (!data) {
      return NextResponse.json(null);
    }

    return NextResponse.json(toResponseBody(data));
  } catch (error) {
    console.error('GET /api/tracker failed:', error);
    return NextResponse.json(
      { error: 'Failed to load tracker data' },
      { status: 500 }
    );
  }
}

/**
 * Saves the whole tracker document, guarded against overwriting real data:
 * - The client must send `baseUpdatedAt` (the `updatedAt` it loaded). If the
 *   document changed since then (another device / tab), nothing is written
 *   and 409 is returned. A request without the field at all is rejected when
 *   a document exists, so a client that never loaded can't overwrite it.
 * - A save that would empty both stages and medications of a document that
 *   has data is rejected with 422, unless it carries `confirmClear: true`.
 */
export async function POST(request: Request) {
  try {
    const resolved = await resolveTrackerUserId();
    if (resolved.error) return resolved.error;
    const userId = resolved.userId;

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const hasBaseField = Object.prototype.hasOwnProperty.call(body, 'baseUpdatedAt');
    let baseUpdatedAt: Date | null = null;
    if (body.baseUpdatedAt) {
      baseUpdatedAt = new Date(body.baseUpdatedAt);
      if (isNaN(baseUpdatedAt.getTime())) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
      }
    }

    await connectDB();

    const update = {
      userId,
      hasActiveCycle: Boolean(body.hasActiveCycle),
      cycleStartDate: body.cycleStartDate ? new Date(body.cycleStartDate) : null,
      stages: Array.isArray(body.stages) ? body.stages : [],
      medications: Array.isArray(body.medications) ? body.medications : [],
      completedTasks: body.completedTasks ?? {},
    };

    const existing = (await Tracker.findOne({ userId })
      .select('updatedAt stages medications')
      .lean()) as TrackerLean | null;

    if (!existing) {
      // First save for a new user. A client that thinks a document exists
      // (sent a version) is out of sync — make it reload.
      if (baseUpdatedAt) return conflict();
      try {
        const created = await Tracker.create(update);
        return NextResponse.json(toResponseBody(created.toObject() as TrackerLean));
      } catch (err) {
        // Duplicate key: another request created the document concurrently.
        if ((err as { code?: number })?.code === 11000) return conflict();
        throw err;
      }
    }

    if (!hasBaseField) return conflict();

    const existingVersion = existing.updatedAt ?? null;
    const sameVersion =
      existingVersion === null
        ? baseUpdatedAt === null
        : baseUpdatedAt !== null && existingVersion.getTime() === baseUpdatedAt.getTime();
    if (!sameVersion) return conflict();

    // Emptying a tracker that has data needs an explicit flag, sent by the
    // client only when the user deliberately deletes the last stage/medication.
    const hadData =
      (existing.stages?.length ?? 0) > 0 || (existing.medications?.length ?? 0) > 0;
    const confirmClear = body.confirmClear === true;
    if (hadData && update.stages.length === 0 && update.medications.length === 0 && !confirmClear) {
      return NextResponse.json({ error: 'refusing to clear tracker' }, { status: 422 });
    }

    // Conditional write: only succeeds if the version is still the one we checked.
    const versionFilter =
      existingVersion === null
        ? { updatedAt: { $exists: false } }
        : { updatedAt: existingVersion };

    const updated = (await Tracker.findOneAndUpdate(
      { userId, ...versionFilter },
      { $set: update },
      { new: true, lean: true }
    )) as TrackerLean | null;

    if (!updated) return conflict();

    return NextResponse.json(toResponseBody(updated));
  } catch (error) {
    console.error('POST /api/tracker failed:', error);
    return NextResponse.json(
      { error: 'Failed to save tracker data' },
      { status: 500 }
    );
  }
}
