/**
 * Test accounts must never cause a Telegram message to be sent (the bot's
 * single chat belongs to the real account).
 *
 * An email is a test account if:
 * - its domain is `example.test` or ends with `.test` (reserved, never real), or
 * - it is listed in the TEST_ACCOUNT_EMAILS env var (comma-separated).
 */
export function parseEmailList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isTestAccountEmail(
  email: string | null | undefined,
  extraTestEmails: string[] = parseEmailList(process.env.TEST_ACCOUNT_EMAILS)
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1] ?? '';
  if (domain === 'test' || domain.endsWith('.test')) return true;
  return extraTestEmails.includes(normalized);
}
