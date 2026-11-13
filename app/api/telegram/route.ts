import { NextResponse } from 'next/server';
import { getTrackerAccess, ownerEmailForTracker } from '@/lib/access';
import { isTestAccountEmail } from '@/lib/test-accounts';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    // Only members of a tracker (owner or approved partner) may send.
    const access = await getTrackerAccess();
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!access.trackerUserId) {
      return NextResponse.json({ error: 'no-access' }, { status: 403 });
    }

    const body = await request.json();
    const { message } = body ?? {};

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Test accounts never send to the real chat — neither the caller nor the tracker's owner.
    const ownerEmail = await ownerEmailForTracker(access.trackerUserId);
    if (access.user.isTestAccount || isTestAccountEmail(ownerEmail)) {
      console.info('[telegram] skipped for test account');
      return NextResponse.json({ success: false, skipped: 'test-account' });
    }

    const result = await sendTelegramMessage(message);
    if (!result.sent) {
      if (result.reason === 'dry-run') {
        return NextResponse.json({ success: false, skipped: 'dry-run' });
      }
      return NextResponse.json({ error: 'Telegram is not configured' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Telegram API error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
