import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import {
  initialTrackerFields,
  resolveTrackerAccess,
  toResponseBody,
  type TrackerLean,
} from '@/lib/tracker/server';
import { isTrackerEmpty } from '@/lib/tracker/empty';
import { ymdInIsrael } from '@/lib/israel-date';
import { validateLmp } from '@/lib/pregnancy/dates';

/**
 * First-run choice for a brand-new account (owner only): fertility
 * treatments or pregnancy. Refused for any tracker that already has data,
 * so existing users can never be re-initialized.
 */
export async function POST(request: Request) {
  try {
    const resolved = await resolveTrackerAccess({ ownerOnly: true });
    if (resolved.error) return resolved.error;
    const userId = resolved.userId;

    const body = await request.json().catch(() => null);
    const choice = body?.choice;
    if (choice !== 'fertility' && choice !== 'pregnancy') {
      return NextResponse.json({ error: 'invalid-choice' }, { status: 400 });
    }
    let lmpDate: string | undefined;
    if (choice === 'pregnancy') {
      const invalid = validateLmp(body?.lmpDate, ymdInIsrael());
      if (invalid) return NextResponse.json({ error: 'invalid-date', reason: invalid }, { status: 400 });
      lmpDate = body.lmpDate;
    }

    await connectDB();
    const existing = (await Tracker.findOne({ userId }).lean()) as (TrackerLean & { updatedAt?: Date }) | null;
    if (!isTrackerEmpty(existing)) {
      return NextResponse.json({ error: 'not-empty' }, { status: 409 });
    }

    const fields = initialTrackerFields(userId, choice, lmpDate);

    if (!existing) {
      try {
        const created = await Tracker.create(fields);
        return NextResponse.json(toResponseBody(created.toObject() as TrackerLean), { status: 201 });
      } catch (err) {
        if ((err as { code?: number })?.code === 11000) {
          return NextResponse.json({ error: 'conflict' }, { status: 409 });
        }
        throw err;
      }
    }

    // An empty document already exists (e.g. created when a partner was
    // approved). Fill it only if it is still exactly the version we checked.
    const { userId: _ignored, ...setFields } = fields;
    void _ignored;
    const filter = existing.updatedAt
      ? { userId, updatedAt: existing.updatedAt }
      : { userId, updatedAt: { $exists: false } };
    const updated = (await Tracker.findOneAndUpdate(filter, { $set: setFields }, { new: true, lean: true })) as
      | TrackerLean
      | null;
    if (!updated) return NextResponse.json({ error: 'conflict' }, { status: 409 });
    return NextResponse.json(toResponseBody(updated));
  } catch (error) {
    console.error('POST /api/tracker/onboarding failed:', error);
    return NextResponse.json({ error: 'Failed to set up tracker' }, { status: 500 });
  }
}
