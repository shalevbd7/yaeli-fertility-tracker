import { describe, expect, it } from 'vitest';
import { isTestAccountEmail, parseEmailList } from './test-accounts';
import { clientIpFromHeaders, rateLimitBucket } from './rate-limit-core';

describe('isTestAccountEmail', () => {
  it('treats .test domains as test accounts', () => {
    expect(isTestAccountEmail('owner-test@example.test', [])).toBe(true);
    expect(isTestAccountEmail('Partner@Example.TEST', [])).toBe(true);
    expect(isTestAccountEmail('x@test', [])).toBe(true);
  });

  it('treats listed emails as test accounts (case-insensitive)', () => {
    const list = parseEmailList(' QA@gmail.com, other@site.com ,');
    expect(list).toEqual(['qa@gmail.com', 'other@site.com']);
    expect(isTestAccountEmail('qa@gmail.com', list)).toBe(true);
    expect(isTestAccountEmail('QA@Gmail.com', list)).toBe(true);
  });

  it('does not flag real-looking emails', () => {
    expect(isTestAccountEmail('someone@gmail.com', [])).toBe(false);
    expect(isTestAccountEmail('someone@testing.com', [])).toBe(false);
    expect(isTestAccountEmail('someone@test.com', [])).toBe(false);
    expect(isTestAccountEmail(null, [])).toBe(false);
    expect(isTestAccountEmail('', [])).toBe(false);
  });
});

describe('rate limit helpers', () => {
  const rule = { name: 'r', limit: 3, windowMs: 1000 };

  it('puts requests in the same window into the same bucket', () => {
    expect(rateLimitBucket(rule, 'ip', 2000).key).toBe(rateLimitBucket(rule, 'ip', 2999).key);
    expect(rateLimitBucket(rule, 'ip', 2999).key).not.toBe(rateLimitBucket(rule, 'ip', 3000).key);
    expect(rateLimitBucket(rule, 'ip', 2500).expiresAt.getTime()).toBe(3000);
  });

  it('separates subjects', () => {
    expect(rateLimitBucket(rule, 'a', 0).key).not.toBe(rateLimitBucket(rule, 'b', 0).key);
  });

  it('reads the client IP from proxy headers', () => {
    const headers: Record<string, string> = { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' };
    expect(clientIpFromHeaders((n) => headers[n])).toBe('1.2.3.4');
    expect(clientIpFromHeaders((n) => ({ 'x-real-ip': '5.6.7.8' } as Record<string, string>)[n])).toBe('5.6.7.8');
    expect(clientIpFromHeaders(() => null)).toBe('unknown');
  });
});
