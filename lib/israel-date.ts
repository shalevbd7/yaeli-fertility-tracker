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
