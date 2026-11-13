import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { isInviteUsable } from '@/lib/invites';
import {
  EMAIL_PATTERN,
  claimInvite,
  findInviteByToken,
  inviteRateLimitOk,
  jsonError,
  pingOwnerAboutJoinRequest,
  tooManyRequests,
} from '@/lib/partner';

/**
 * Public, but only works with a valid, unused invite token: the ONLY way to
 * create an account besides the admin seed endpoint. Creates a 'partner'
 * account and marks the invite as waiting for the owner's approval.
 */
export async function POST(request: Request) {
  try {
    if (!(await inviteRateLimitOk(request))) return tooManyRequests();

    const body = await request.json().catch(() => null);
    const token = body?.token;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';

    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8 || password.length > 200) {
      return jsonError('invalid-input', 400);
    }

    const invite = await findInviteByToken(token);
    if (!isInviteUsable(invite)) {
      return jsonError('invalid-invite', 410);
    }

    await connectDB();

    // Same generic answer whether or not the email exists, and the endpoint is
    // only reachable with a valid token and rate limited.
    if (await User.exists({ email })) {
      return jsonError('signup-failed', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await User.create({
        email,
        passwordHash,
        name,
        trackerUserId: `partner-${randomUUID()}`,
        accountType: 'partner',
      });
    } catch (err) {
      if ((err as { code?: number })?.code === 11000) return jsonError('signup-failed', 409);
      throw err;
    }

    const claimed = await claimInvite(token as string, user._id.toString());
    if (!claimed) {
      // The link was used/expired in the meantime: undo the account we just made.
      await User.deleteOne({ _id: user._id });
      return jsonError('invalid-invite', 410);
    }

    pingOwnerAboutJoinRequest(claimed.trackerUserId, { name, email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/invites/signup failed:', error);
    return jsonError('Failed to sign up', 500);
  }
}
