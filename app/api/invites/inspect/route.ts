import { NextResponse } from 'next/server';
import { isInviteUsable } from '@/lib/invites';
import { findInviteByToken, inviteRateLimitOk, jsonError, tooManyRequests } from '@/lib/partner';

/** Public: is this invite link still valid? Reveals nothing else. */
export async function POST(request: Request) {
  try {
    if (!(await inviteRateLimitOk(request))) return tooManyRequests();
    const body = await request.json().catch(() => null);
    const invite = await findInviteByToken(body?.token);
    return NextResponse.json({ valid: isInviteUsable(invite) });
  } catch (error) {
    console.error('POST /api/invites/inspect failed:', error);
    return jsonError('Failed to check invite', 500);
  }
}
