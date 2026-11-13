import { NextResponse } from 'next/server';
import { getTrackerAccess } from '@/lib/access';
import { connectDB } from '@/lib/mongodb';
import { Invite } from '@/lib/models/Invite';
import { Tracker } from '@/lib/models/Tracking';
import { generateInviteToken, inviteExpiresAt } from '@/lib/invites';
import { consumeRateLimit } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/rate-limit-core';
import { jsonError, tooManyRequests } from '@/lib/partner';

async function requireOwner() {
  const access = await getTrackerAccess();
  if (!access) return { error: jsonError('Unauthorized', 401) };
  if (access.role !== 'owner' || !access.trackerUserId) return { error: jsonError('forbidden', 403) };
  return { access, trackerUserId: access.trackerUserId };
}

/** Owner creates a new invite link. Any older unused link is revoked. */
export async function POST(request: Request) {
  try {
    const owner = await requireOwner();
    if (owner.error) return owner.error;
    const { access, trackerUserId } = owner;

    if (!(await consumeRateLimit(RATE_LIMITS.inviteCreate, access.user.id))) {
      return tooManyRequests();
    }

    await connectDB();

    const tracker = (await Tracker.findOne({ userId: trackerUserId })
      .select('memberUserIds')
      .lean()) as { memberUserIds?: string[] } | null;
    if ((tracker?.memberUserIds?.length ?? 0) > 0) {
      return jsonError('already-linked', 409);
    }
    if (await Invite.exists({ trackerUserId, status: 'accepted' })) {
      return jsonError('request-pending', 409);
    }

    await Invite.updateMany({ trackerUserId, status: 'pending' }, { $set: { status: 'revoked' } });

    const { token, tokenHash } = generateInviteToken();
    const expiresAt = inviteExpiresAt();
    await Invite.create({
      trackerUserId,
      createdByUserId: access.user.id,
      tokenHash,
      expiresAt,
      status: 'pending',
    });

    const origin = new URL(request.url).origin;
    // The raw token is returned only here, once; only its hash is stored.
    return NextResponse.json({ url: `${origin}/invite/${token}`, expiresAt }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invites failed:', error);
    return jsonError('Failed to create invite', 500);
  }
}

/** Owner cancels the current unused link. */
export async function DELETE() {
  try {
    const owner = await requireOwner();
    if (owner.error) return owner.error;
    await connectDB();
    await Invite.updateMany(
      { trackerUserId: owner.trackerUserId, status: 'pending' },
      { $set: { status: 'revoked' } }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/invites failed:', error);
    return jsonError('Failed to revoke invite', 500);
  }
}
