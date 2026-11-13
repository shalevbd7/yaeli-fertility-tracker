import { createHash, randomBytes } from 'node:crypto';

/** Invite links are valid for 48 hours. */
export const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export type InviteStatus =
  | 'pending'   // created, link not used yet
  | 'accepted'  // partner used the link, waiting for the owner's decision
  | 'approved'  // owner approved, accounts linked
  | 'rejected'  // owner rejected
  | 'revoked';  // owner cancelled the link / created a newer one

export type InviteLike = {
  status: InviteStatus | string;
  expiresAt: Date | string;
};

/** 32 random bytes, base64url → 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInviteToken(token) };
}

/** Tokens are stored only as a SHA-256 hash (they're high-entropy, so no salt is needed). */
export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function isValidTokenFormat(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

export function inviteExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_TTL_MS);
}

export function isInviteExpired(invite: InviteLike, now: Date = new Date()): boolean {
  const expires = new Date(invite.expiresAt).getTime();
  return isNaN(expires) || now.getTime() >= expires;
}

/** A link can be used (once) only while it is pending and not expired. */
export function isInviteUsable(invite: InviteLike | null | undefined, now: Date = new Date()): boolean {
  if (!invite) return false;
  return invite.status === 'pending' && !isInviteExpired(invite, now);
}

/** What the owner sees for the current invite in Settings. */
export function describeInviteForOwner(
  invite: InviteLike | null | undefined,
  now: Date = new Date()
): 'none' | 'active' | 'expired' | 'awaiting-approval' {
  if (!invite) return 'none';
  if (invite.status === 'accepted') return 'awaiting-approval';
  if (invite.status !== 'pending') return 'none';
  return isInviteExpired(invite, now) ? 'expired' : 'active';
}
