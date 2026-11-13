import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { User } from '@/lib/models/User';
import { isTestAccountEmail } from '@/lib/test-accounts';
import { sendTelegramMessage } from '@/lib/telegram';
import {
  israelHourString,
  shouldRemindMedication,
  ymdInIsrael,
} from '@/lib/israel-date';

function completedTasksRecord(raw: unknown): Record<string, unknown> {
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

function cycleStartYmd(cycleStartDate: Date | string | undefined): string | undefined {
  if (!cycleStartDate) return undefined;
  if (typeof cycleStartDate === 'string') return cycleStartDate.slice(0, 10);
  return ymdInIsrael(cycleStartDate);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const activeTrackers = await Tracker.find({ hasActiveCycle: true }).lean();
    const todayYmd = ymdInIsrael();
    const currentHour = israelHourString();

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

      const completedTasks = completedTasksRecord(tracker.completedTasks);
      const cycleStart = cycleStartYmd(tracker.cycleStartDate);

      type CronMed = Parameters<typeof shouldRemindMedication>[0] & {
        name: string;
        dosage?: string;
        notes?: string;
      };
      const medsToTakeNow = (tracker.medications as CronMed[]).filter((med) =>
        shouldRemindMedication(
          med,
          tracker.stages,
          cycleStart,
          todayYmd,
          currentHour,
          completedTasks
        )
      );

      for (const med of medsToTakeNow) {
        const text = `היי יעלי אהובה שלי ❤️\nתזכורת אוטומטית לקחת ${med.name} (${med.dosage}).\n${med.notes ? 'הערה: ' + med.notes : ''}\nאוהב המון! ✨`;

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
