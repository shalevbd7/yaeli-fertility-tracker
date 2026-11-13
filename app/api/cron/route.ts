import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { User } from '@/lib/models/User';
import { isTestAccountEmail } from '@/lib/test-accounts';
import { sendTelegramMessage } from '@/lib/telegram';
import { israelHourString, israelWeekday, ymdInIsrael } from '@/lib/israel-date';
import { remindersForTracker, type CronTracker } from '@/lib/reminders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fertility trackers with an active cycle (as before) + trackers in pregnancy mode.
    const activeTrackers = (await Tracker.find({
      $or: [{ hasActiveCycle: true }, { mode: 'pregnancy' }],
    }).lean()) as unknown as CronTracker[];
    const todayYmd = ymdInIsrael();
    const currentHour = israelHourString();
    const weekday = israelWeekday();

    // Trackers owned by test accounts never send (the chat belongs to the real account).
    // A tracker without a matching user record is NOT skipped, to keep the real
    // account's reminders working exactly as before.
    const owners = (await User.find({
      trackerUserId: { $in: activeTrackers.map((t) => t.userId) },
    })
      .select('trackerUserId email')
      .lean()) as Array<{ trackerUserId: string; email: string }>;
    const testTrackerIds = new Set(
      owners.filter((u) => isTestAccountEmail(u.email)).map((u) => u.trackerUserId)
    );

    let sentCount = 0;

    for (const tracker of activeTrackers) {
      if (testTrackerIds.has(tracker.userId)) continue;

      const messages = remindersForTracker(tracker, { todayYmd, currentHour, weekday });

      for (const text of messages) {
        try {
          await sendTelegramMessage(text);
        } catch (err) {
          // As before, one failed message doesn't stop the other reminders.
          console.error('Cron: Telegram send failed:', err);
        }

        sentCount++;
      }
    }

    return NextResponse.json({ success: true, messagesSent: sentCount });
  } catch (error: unknown) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
