import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { resolveTrackerAccess, toResponseBody, type TrackerLean } from '@/lib/tracker/server';
import { ymdInIsrael } from '@/lib/israel-date';
import { validateLmp } from '@/lib/pregnancy/dates';

/**
 * Owner-only pregnancy mode switch.
 *  - startPregnancy {lmpDate}: mode → pregnancy. The fertility data stays
 *    exactly where it is (only hidden in the UI) and fertility reminders stop.
 *  - updateLmp {lmpDate}: corrects the pregnancy anchor date.
 *  - restoreFertility: mode → fertility. Pregnancy data is kept (hidden).
 * Nothing is ever deleted. The client reloads after a successful call.
 */
export async function POST(request: Request) {
  try {
    const resolved = await resolveTrackerAccess({ ownerOnly: true });
    if (resolved.error) return resolved.error;
    const userId = resolved.userId;

    const body = await request.json().catch(() => null);
    const action = body?.action;
    await connectDB();

    const existing = (await Tracker.findOne({ userId }).select('mode pregnancy.lmpDate').lean()) as TrackerLean | null;
    if (!existing) {
      // Brand-new accounts go through /api/tracker/onboarding first.
      return NextResponse.json({ error: 'no-tracker' }, { status: 409 });
    }
    const isPregnancy = existing.mode === 'pregnancy';

    let update: Record<string, unknown>;
    if (action === 'startPregnancy' || action === 'updateLmp') {
      const lmpDate = body?.lmpDate;
      const invalid = validateLmp(lmpDate, ymdInIsrael());
      if (invalid) return NextResponse.json({ error: 'invalid-date', reason: invalid }, { status: 400 });

      if (action === 'startPregnancy') {
        if (isPregnancy) return NextResponse.json({ error: 'already-pregnancy' }, { status: 409 });
        update = {
          mode: 'pregnancy',
          fertilityArchivedAt: new Date(),
          'pregnancy.lmpDate': lmpDate,
          'pregnancy.startedAt': new Date(),
        };
      } else {
        if (!isPregnancy) return NextResponse.json({ error: 'not-pregnancy' }, { status: 409 });
        update = { 'pregnancy.lmpDate': lmpDate };
      }
    } else if (action === 'restoreFertility') {
      if (!isPregnancy) return NextResponse.json({ error: 'not-pregnancy' }, { status: 409 });
      update = { mode: 'fertility', fertilityArchivedAt: null };
    } else {
      return NextResponse.json({ error: 'invalid-action' }, { status: 400 });
    }

    const updated = (await Tracker.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, lean: true }
    )) as TrackerLean | null;

    return NextResponse.json(updated ? toResponseBody(updated) : null);
  } catch (error) {
    console.error('POST /api/tracker/mode failed:', error);
    return NextResponse.json({ error: 'Failed to change mode' }, { status: 500 });
  }
}
