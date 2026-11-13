import { NextResponse } from 'next/server';
import { getTrackerAccess } from '@/lib/access';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { jsonError } from '@/lib/partner';

/**
 * Unlink. The owner removes the partner, or the partner leaves.
 * Takes effect immediately (access is checked from the DB on every request).
 */
export async function DELETE() {
  try {
    const access = await getTrackerAccess();
    if (!access) return jsonError('Unauthorized', 401);
    await connectDB();

    if (access.role === 'owner' && access.trackerUserId) {
      await Tracker.updateOne({ userId: access.trackerUserId }, { $set: { memberUserIds: [] } });
      return NextResponse.json({ ok: true });
    }
    if (access.role === 'partner' && access.trackerUserId) {
      await Tracker.updateOne({ userId: access.trackerUserId }, { $pull: { memberUserIds: access.user.id } });
      return NextResponse.json({ ok: true });
    }
    return jsonError('not-linked', 400);
  } catch (error) {
    console.error('DELETE /api/partner failed:', error);
    return jsonError('Failed to unlink', 500);
  }
}
