import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { resolveTrackerAccess, toResponseBody, type TrackerLean } from '@/lib/tracker/server';
import { sanitizePregnancyEditable } from '@/lib/pregnancy/sanitize';

function conflict() {
  return NextResponse.json({ error: 'conflict' }, { status: 409 });
}

export async function GET() {
  try {
    const resolved = await resolveTrackerAccess();
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
    const resolved = await resolveTrackerAccess();
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
      .select('updatedAt stages medications pregnancy.lmpDate')
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

    // Pregnancy data that the owner and partner edit together. Only written when
    // the tracker already has pregnancy data; the anchor date and the mode are
    // owner-only and changed through /api/tracker/mode, never here.
    const pregnancySet: Record<string, unknown> = {};
    if (existing.pregnancy && body.pregnancy && typeof body.pregnancy === 'object') {
      const p = sanitizePregnancyEditable(body.pregnancy);
      pregnancySet['pregnancy.tests'] = p.tests;
      pregnancySet['pregnancy.symptomLog'] = p.symptomLog;
      pregnancySet['pregnancy.medications'] = p.medications;
      pregnancySet['pregnancy.doseLog'] = p.doseLog;
      pregnancySet['pregnancy.asNeededLog'] = p.asNeededLog;
    }

    // Conditional write: only succeeds if the version is still the one we checked.
    const versionFilter =
      existingVersion === null
        ? { updatedAt: { $exists: false } }
        : { updatedAt: existingVersion };

    const updated = (await Tracker.findOneAndUpdate(
      { userId, ...versionFilter },
      { $set: { ...update, ...pregnancySet } },
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
