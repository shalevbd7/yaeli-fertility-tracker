import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
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

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let sentCount = 0;

    for (const tracker of activeTrackers) {
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

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        });

        sentCount++;
      }
    }

    return NextResponse.json({ success: true, messagesSent: sentCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
