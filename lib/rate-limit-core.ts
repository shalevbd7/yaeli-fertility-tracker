/** Pure helpers for the fixed-window rate limiter (see lib/rate-limit.ts). */

export type RateLimitRule = {
  /** Name of the limited action, e.g. 'login-ip'. */
  name: string;
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  loginByIp: { name: 'login-ip', limit: 30, windowMs: 15 * 60 * 1000 },
  loginByEmail: { name: 'login-email', limit: 10, windowMs: 15 * 60 * 1000 },
  inviteByIp: { name: 'invite-ip', limit: 20, windowMs: 15 * 60 * 1000 },
  inviteCreate: { name: 'invite-create', limit: 10, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

/** The bucket a request falls into: one counter per rule + subject + window. */
export function rateLimitBucket(rule: RateLimitRule, subject: string, now: number) {
  const windowIndex = Math.floor(now / rule.windowMs);
  return {
    key: `${rule.name}:${subject}:${windowIndex}`,
    expiresAt: new Date((windowIndex + 1) * rule.windowMs),
  };
}

/** First IP in x-forwarded-for, else x-real-ip, else 'unknown'. */
export function clientIpFromHeaders(get: (name: string) => string | null | undefined): string {
  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return get('x-real-ip')?.trim() || 'unknown';
}
