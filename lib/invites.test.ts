import { describe, expect, it } from 'vitest';
import {
  INVITE_TTL_MS,
  describeInviteForOwner,
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
  isInviteExpired,
  isInviteUsable,
  isValidTokenFormat,
} from './invites';

const now = new Date('2026-11-13T10:00:00Z');

describe('invite tokens', () => {
  it('generates a 43-char base64url token and its sha256 hash', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(isValidTokenFormat(token)).toBe(true);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(tokenHash);
  });

  it('generates different tokens each time', () => {
    expect(generateInviteToken().token).not.toBe(generateInviteToken().token);
  });

  it('rejects malformed tokens', () => {
    expect(isValidTokenFormat('')).toBe(false);
    expect(isValidTokenFormat('short')).toBe(false);
    expect(isValidTokenFormat('a'.repeat(42) + '!')).toBe(false);
    expect(isValidTokenFormat(undefined)).toBe(false);
    expect(isValidTokenFormat(123)).toBe(false);
  });
});

describe('invite expiry (48 hours)', () => {
  it('expires exactly 48 hours after creation', () => {
    expect(inviteExpiresAt(now).getTime() - now.getTime()).toBe(48 * 3600 * 1000);
    expect(INVITE_TTL_MS).toBe(172_800_000);
  });

  it('is usable while pending and before expiry', () => {
    const invite = { status: 'pending', expiresAt: inviteExpiresAt(now) };
    expect(isInviteUsable(invite, now)).toBe(true);
    expect(isInviteUsable(invite, new Date(now.getTime() + INVITE_TTL_MS - 1))).toBe(true);
  });

  it('is not usable at or after the expiry moment', () => {
    const invite = { status: 'pending', expiresAt: inviteExpiresAt(now) };
    const atExpiry = new Date(now.getTime() + INVITE_TTL_MS);
    expect(isInviteExpired(invite, atExpiry)).toBe(true);
    expect(isInviteUsable(invite, atExpiry)).toBe(false);
  });

  it('is single-use: any non-pending status is not usable', () => {
    for (const status of ['accepted', 'approved', 'rejected', 'revoked']) {
      expect(isInviteUsable({ status, expiresAt: inviteExpiresAt(now) }, now)).toBe(false);
    }
  });

  it('treats missing or invalid invites/dates as unusable', () => {
    expect(isInviteUsable(null, now)).toBe(false);
    expect(isInviteUsable({ status: 'pending', expiresAt: 'not a date' }, now)).toBe(false);
  });

  it('accepts ISO strings for expiresAt (as returned from JSON)', () => {
    const invite = { status: 'pending', expiresAt: inviteExpiresAt(now).toISOString() };
    expect(isInviteUsable(invite, now)).toBe(true);
  });
});

describe('describeInviteForOwner', () => {
  it('describes each state', () => {
    const exp = inviteExpiresAt(now);
    expect(describeInviteForOwner(null, now)).toBe('none');
    expect(describeInviteForOwner({ status: 'pending', expiresAt: exp }, now)).toBe('active');
    expect(
      describeInviteForOwner({ status: 'pending', expiresAt: exp }, new Date(exp.getTime() + 1))
    ).toBe('expired');
    expect(describeInviteForOwner({ status: 'accepted', expiresAt: exp }, now)).toBe('awaiting-approval');
    expect(describeInviteForOwner({ status: 'revoked', expiresAt: exp }, now)).toBe('none');
  });
});
