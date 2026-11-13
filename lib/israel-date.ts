const ISRAEL_TZ = 'Asia/Jerusalem';

export function ymdInIsrael(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

export function cycleDayNumber(cycleStartYmd: string, todayYmd: string): number {
  const [sy, sm, sd] = cycleStartYmd.split('-').map(Number);
  const [ty, tm, td] = todayYmd.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const today = Date.UTC(ty, tm - 1, td);
  return Math.floor((today - start) / 86400000) + 1;
}

export function israelHourString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: ISRAEL_TZ,
  }).format(date);
}

export function isTaskCompletedOnDate(
  completedTasks: Record<string, unknown>,
  taskId: string,
  dateYmd: string
): boolean {
  const value = completedTasks[taskId];
  return typeof value === 'string' && value === dateYmd;
}

type StageLike = {
  relativeStartDay: number;
  durationDays?: number;
  medicationId?: string;
};

type MedLike = {
  id: string;
  isContinuous?: boolean;
  hours: string[];
};

export function currentStageForToday(
  stages: StageLike[] | undefined,
  cycleStartYmd: string | undefined,
  todayYmd: string
): StageLike | null {
  if (!stages?.length || !cycleStartYmd) return null;
  const diffDays = cycleDayNumber(cycleStartYmd, todayYmd);
  return (
    stages.find((s) => {
      const end = s.relativeStartDay + (s.durationDays || 1) - 1;
      return diffDays >= s.relativeStartDay && diffDays <= end;
    }) ?? null
  );
}

export function isMedicationDueThisHour(med: MedLike, currentHour: string): boolean {
  return med.hours.some((h) => h.startsWith(currentHour));
}

export function shouldRemindMedication(
  med: MedLike,
  stages: StageLike[] | undefined,
  cycleStartYmd: string | undefined,
  todayYmd: string,
  currentHour: string,
  completedTasks: Record<string, unknown>
): boolean {
  if (!isMedicationDueThisHour(med, currentHour)) return false;
  if (isTaskCompletedOnDate(completedTasks, med.id, todayYmd)) return false;

  if (med.isContinuous) return true;

  const stage = currentStageForToday(stages, cycleStartYmd, todayYmd);
  return stage?.medicationId === med.id;
}

// ---------------------------------------------------------------------------
// YYYY-MM-DD helpers (calendar-day arithmetic, independent of the server's TZ).
// "Today" for the user is always ymdInIsrael().

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(value: unknown): value is string {
  if (typeof value !== 'string' || !YMD_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Whole days from `fromYmd` to `toYmd` (positive if `toYmd` is later). */
export function diffDaysYmd(fromYmd: string, toYmd: string): number {
  return cycleDayNumber(fromYmd, toYmd) - 1;
}

/** Day of week in Israel: 0 = Sunday … 6 = Saturday. */
export function israelWeekday(date: Date = new Date()): number {
  const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: ISRAEL_TZ }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
}

/** Day of week for a YYYY-MM-DD date: 0 = Sunday … 6 = Saturday. */
export function weekdayOfYmd(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
