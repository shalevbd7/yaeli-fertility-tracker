import { NextResponse } from 'next/server';
import { getTrackerAccess } from '@/lib/access';
import { connectDB } from '@/lib/mongodb';
import { Invite } from '@/lib/models/Invite';
import { isInviteUsable } from '@/lib/invites';
import {
  claimInvite,
  findInviteByToken,
  inviteRateLimitOk,
  jsonError,
  pingOwnerAboutJoinRequest,
  tooManyRequests,
} from '@/lib/partner';

/** A logged-in user (existing account) accepts an invite → waits for approval. */
export async function POST(request: Request) {
  try {
    if (!(await inviteRateLimitOk(request))) return tooManyRequests();

    const access = await getTrackerAccess();
    if (!access) return jsonError('Unauthorized', 401);

    const body = await request.json().catch(() => null);
    const token = body?.token;
    const invite = await findInviteByToken(token);
    if (!isInviteUsable(invite)) return jsonError('invalid-invite', 410);

    if (invite!.trackerUserId === access.user.trackerUserId) {
      return jsonError('own-invite', 400);
    }
    if (access.role === 'partner') {
      return jsonError('already-linked', 409);
    }
    await connectDB();
    if (await Invite.exists({ acceptedByUserId: access.user.id, status: 'accepted' })) {
      return jsonError('request-pending', 409);
    }

    const claimed = await claimInvite(token as string, access.user.id);
    if (!claimed) return jsonError('invalid-invite', 410);

    pingOwnerAboutJoinRequest(claimed.trackerUserId, {
      name: access.user.name,
      email: access.user.email,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/invites/accept failed:', error);
    return jsonError('Failed to accept invite', 500);
  }
}
