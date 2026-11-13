import { after, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Invite } from '@/lib/models/Invite';
import { ownerEmailForTracker } from '@/lib/access';
import { hashInviteToken, isValidTokenFormat } from '@/lib/invites';
import { isTestAccountEmail } from '@/lib/test-accounts';
import { sendTelegramMessage } from '@/lib/telegram';
import { consumeRateLimit } from '@/lib/rate-limit';
import { RATE_LIMITS, clientIpFromHeaders } from '@/lib/rate-limit-core';

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export const tooManyRequests = () => jsonError('rate-limited', 429);

/** Rate limit the public invite endpoints per client IP. */
export async function inviteRateLimitOk(request: Request): Promise<boolean> {
  const ip = clientIpFromHeaders((n) => request.headers.get(n));
  return consumeRateLimit(RATE_LIMITS.inviteByIp, ip);
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteLean = {
  _id: { toString(): string };
  trackerUserId: string;
  createdByUserId: string;
  status: string;
  expiresAt: Date;
  acceptedByUserId?: string;
  acceptedAt?: Date;
};

export async function findInviteByToken(token: unknown): Promise<InviteLean | null> {
  if (!isValidTokenFormat(token)) return null;
  await connectDB();
  return (await Invite.findOne({ tokenHash: hashInviteToken(token) }).lean()) as InviteLean | null;
}

/**
 * Atomically uses a link: only succeeds if it is still pending and unexpired,
 * so a link can never be used twice (even by two requests at the same time).
 */
export async function claimInvite(token: string, userId: string): Promise<InviteLean | null> {
  await connectDB();
  return (await Invite.findOneAndUpdate(
    { tokenHash: hashInviteToken(token), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'accepted', acceptedByUserId: userId, acceptedAt: new Date() } },
    { new: true, lean: true }
  )) as InviteLean | null;
}

/**
 * Fire-and-forget Telegram ping to the existing chat that a join request is
 * waiting. Runs after the response is sent; skipped for test accounts.
 */
export function pingOwnerAboutJoinRequest(
  trackerUserId: string,
  requester: { name: string; email: string }
) {
  after(async () => {
    try {
      const ownerEmail = await ownerEmailForTracker(trackerUserId);
      if (isTestAccountEmail(ownerEmail) || isTestAccountEmail(requester.email)) {
        console.info('[telegram] join-request ping skipped for test account');
        return;
      }
      await sendTelegramMessage(
        `📩 בקשת הצטרפות חדשה ל"המסע שלנו"\n${requester.name} מבקש/ת להצטרף למעקב המשותף.\nאפשר לאשר או לדחות במסך ההגדרות באפליקציה.`
      );
    } catch (err) {
      console.error('Join-request ping failed:', err);
    }
  });
}
