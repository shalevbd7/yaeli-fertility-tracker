/**
 * Per-dose medication scheduling for pregnancy medications.
 *
 * Unlike the fertility medications (one "taken today" flag per medication in
 * `completedTasks`), every scheduled time is tracked separately in `doseLog`:
 * key `${medId}@${HH:MM}` → the date (YYYY-MM-DD) it was last taken. Taking
 * the 08:00 dose therefore never cancels the 20:00 reminder.
 */
export type ScheduleType = 'daily' | 'weekly' | 'asNeeded';

export type DoseMed = {
  id: string;
  hours: string[];
  /** Missing = 'daily' (the fertility medications never set it). */
  schedule?: ScheduleType | string;
  /** For 'weekly': days of week, 0 = Sunday … 6 = Saturday. */
  weekdays?: number[];
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(t: unknown): t is string {
  return typeof t === 'string' && TIME_PATTERN.test(t);
}

/** Valid HH:MM times, de-duplicated and sorted. */
export function normalizeTimes(times: unknown[]): string[] {
  return Array.from(new Set(times.map((t) => (typeof t === 'string' ? t.trim() : t)).filter(isValidTime))).sort();
}

export function doseKey(medId: string, time: string): string {
  return `${medId}@${time}`;
}

export function scheduleOf(med: DoseMed): ScheduleType {
  return med.schedule === 'weekly' || med.schedule === 'asNeeded' ? med.schedule : 'daily';
}

export function isScheduledOnWeekday(med: DoseMed, weekday: number): boolean {
  const schedule = scheduleOf(med);
  if (schedule === 'asNeeded') return false;
  if (schedule === 'weekly') return (med.weekdays ?? []).includes(weekday);
  return true;
}

/** The scheduled dose times of a medication on a given weekday. */
export function dosesForDay(med: DoseMed, weekday: number): string[] {
  return isScheduledOnWeekday(med, weekday) ? normalizeTimes(med.hours ?? []) : [];
}

export function isDoseTaken(
  doseLog: Record<string, unknown>,
  medId: string,
  time: string,
  dateYmd: string
): boolean {
  return doseLog[doseKey(medId, time)] === dateYmd;
}

/**
 * Doses due in the current hour that weren't marked as taken today.
 * `currentHour` is "HH" (as from israelHourString()).
 */
export function dosesDueThisHour<M extends DoseMed>(
  meds: M[],
  doseLog: Record<string, unknown>,
  todayYmd: string,
  currentHour: string,
  weekday: number
): Array<{ med: M; time: string }> {
  const due: Array<{ med: M; time: string }> = [];
  for (const med of meds) {
    for (const time of dosesForDay(med, weekday)) {
      if (time.startsWith(currentHour) && !isDoseTaken(doseLog, med.id, time, todayYmd)) {
        due.push({ med, time });
      }
    }
  }
  return due;
}
