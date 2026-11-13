/**
 * The single place that talks to the Telegram Bot API.
 *
 * - The bot token and chat id come from the environment, exactly as before
 *   (one chat, belonging to the existing real account).
 * - TELEGRAM_DRY_RUN=1 logs instead of sending (use it locally).
 * - Callers must skip test accounts BEFORE calling this (see lib/test-accounts).
 */
export type TelegramResult = { sent: boolean; reason?: 'dry-run' | 'not-configured' };

export function isTelegramDryRun(): boolean {
  const v = process.env.TELEGRAM_DRY_RUN;
  return v === '1' || v === 'true';
}

export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  if (isTelegramDryRun()) {
    console.info('[telegram dry-run] would send:', text);
    return { sent: false, reason: 'dry-run' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { sent: false, reason: 'not-configured' };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.description || `Telegram API error ${response.status}`);
  }
  return { sent: true };
}
