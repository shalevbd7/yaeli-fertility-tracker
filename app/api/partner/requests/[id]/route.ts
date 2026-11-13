import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getTrackerAccess } from '@/lib/access';
import { connectDB } from '@/lib/mongodb';
import { Invite } from '@/lib/models/Invite';
import { Tracker } from '@/lib/models/Tracking';
import { jsonError } from '@/lib/partner';

/** Owner approves or rejects a pending join request. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const access = await getTrackerAccess();
    if (!access) return jsonError('Unauthorized', 401);
    if (access.role !== 'owner' || !access.trackerUserId) return jsonError('forbidden', 403);
    const trackerUserId = access.trackerUserId;

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return jsonError('not-found', 404);

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== 'approve' && action !== 'reject') return jsonError('invalid-input', 400);

    await connectDB();
    const invite = (await Invite.findOne({ _id: id, trackerUserId, status: 'accepted' }).lean()) as {
      acceptedByUserId?: string;
    } | null;
    if (!invite?.acceptedByUserId) return jsonError('not-found', 404);
    const requesterId = invite.acceptedByUserId;

    if (action === 'reject') {
      await Invite.updateOne({ _id: id, status: 'accepted' }, { $set: { status: 'rejected', decidedAt: new Date() } });
      return NextResponse.json({ ok: true });
    }

    // Approve: the requester must not be linked anywhere, and the tracker must
    // not have a partner yet (one partner per tracker).
    if (await Tracker.exists({ memberUserIds: requesterId })) {
      return jsonError('requester-already-linked', 409);
    }
    try {
      const linked = await Tracker.findOneAndUpdate(
        {
          userId: trackerUserId,
          $or: [{ memberUserIds: { $exists: false } }, { memberUserIds: { $size: 0 } }],
        },
        { $set: { memberUserIds: [requesterId] } },
        // Upsert only creates the owner's (empty) tracker if it doesn't exist yet.
        { new: true, upsert: true, lean: true }
      );
      if (!linked) return jsonError('already-linked', 409);
    } catch (err) {
      // Duplicate key: the tracker exists and already has a partner.
      if ((err as { code?: number })?.code === 11000) return jsonError('already-linked', 409);
      throw err;
    }

    await Invite.updateOne({ _id: id }, { $set: { status: 'approved', decidedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/partner/requests failed:', error);
    return jsonError('Failed to update request', 500);
  }
}
