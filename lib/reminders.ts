import { shouldRemindMedication, ymdInIsrael } from '@/lib/israel-date';
import { dosesDueThisHour, type DoseMed } from '@/lib/pregnancy/doses';

/**
 * Decides which automatic Telegram reminders a tracker gets this hour.
 * Used by /api/cron. Pure, so it is unit-tested instead of calling the cron.
 */
type ReminderMed = {
  id: string;
  name: string;
  dosage?: string;
  notes?: string;
  hours: string[];
  isContinuous?: boolean;
  schedule?: string;
  weekdays?: number[];
};

export type CronTracker = {
  userId: string;
  hasActiveCycle?: boolean;
  cycleStartDate?: Date | string | null;
  stages?: Array<{ relativeStartDay: number; durationDays?: number; medicationId?: string }>;
  medications?: ReminderMed[];
  completedTasks?: unknown;
  mode?: string | null;
  pregnancy?: { medications?: ReminderMed[]; doseLog?: unknown } | null;
};

export type ReminderContext = { todayYmd: string; currentHour: string; weekday: number };

function record(raw: unknown): Record<string, unknown> {
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

function cycleStartYmd(cycleStartDate: Date | string | null | undefined): string | undefined {
  if (!cycleStartDate) return undefined;
  if (typeof cycleStartDate === 'string') return cycleStartDate.slice(0, 10);
  return ymdInIsrael(cycleStartDate);
}

/** The automatic reminder text — unchanged from the original cron. */
export function reminderMessage(med: { name: string; dosage?: string; notes?: string }): string {
  return `היי יעלי אהובה שלי ❤️\nתזכורת אוטומטית לקחת ${med.name} (${med.dosage}).\n${med.notes ? 'הערה: ' + med.notes : ''}\nאוהב המון! ✨`;
}

export function remindersForTracker(tracker: CronTracker, ctx: ReminderContext): string[] {
  // Pregnancy mode: per-dose reminders for pregnancy medications only.
  // (Fertility reminders stop while the fertility data is archived.)
  if (tracker.mode === 'pregnancy') {
    const meds = (tracker.pregnancy?.medications ?? []) as Array<ReminderMed & DoseMed>;
    const doseLog = record(tracker.pregnancy?.doseLog);
    return dosesDueThisHour(meds, doseLog, ctx.todayYmd, ctx.currentHour, ctx.weekday).map(({ med }) =>
      reminderMessage(med)
    );
  }

  // Fertility (every existing tracker): exactly the original rules.
  if (!tracker.hasActiveCycle) return [];
  const completedTasks = record(tracker.completedTasks);
  const cycleStart = cycleStartYmd(tracker.cycleStartDate);
  return (tracker.medications ?? [])
    .filter((med) =>
      shouldRemindMedication(med, tracker.stages, cycleStart, ctx.todayYmd, ctx.currentHour, completedTasks)
    )
    .map(reminderMessage);
}
