import { addDaysYmd, diffDaysYmd, isValidYmd } from '@/lib/israel-date';

/**
 * Pregnancy dating. Gestational age is counted from the first day of the
 * last menstrual period (LMP); the estimated due date is LMP + 280 days
 * (40 weeks). All dates are YYYY-MM-DD strings in Israel time.
 */
export const PREGNANCY_LENGTH_DAYS = 280;
/** Inputs older than this are rejected (beyond any realistic pregnancy). */
export const MAX_GESTATION_WEEKS = 44;
/** The "current week" input accepts 0+0 … 42+6. */
export const MAX_INPUT_WEEKS = 42;

export type Trimester = 1 | 2 | 3;

/**
 * Trimester boundaries as in the NHS week-by-week guide:
 * 1st = up to the end of week 12, 2nd = weeks 13–27, 3rd = week 28 onwards.
 * `weeks` is completed weeks (the "12" in 12+3).
 */
export function trimesterForWeeks(weeks: number): Trimester {
  if (weeks < 13) return 1;
  if (weeks < 28) return 2;
  return 3;
}

export function dueDateFromLmp(lmpYmd: string): string {
  return addDaysYmd(lmpYmd, PREGNANCY_LENGTH_DAYS);
}

/** "I'm X weeks + Y days today" → LMP date. */
export function lmpFromGestationalAge(todayYmd: string, weeks: number, days: number): string {
  return addDaysYmd(todayYmd, -(weeks * 7 + days));
}

export type GestationalAge = { totalDays: number; weeks: number; days: number };

export function gestationalAge(lmpYmd: string, todayYmd: string): GestationalAge {
  const totalDays = diffDaysYmd(lmpYmd, todayYmd);
  const safe = Math.max(0, totalDays);
  return { totalDays, weeks: Math.floor(safe / 7), days: safe % 7 };
}

export type PregnancyStatus = GestationalAge & {
  trimester: Trimester;
  dueDate: string;
  /** Days until the due date (negative once it has passed). */
  daysToDue: number;
  /** 0..1 progress through 40 weeks (capped at 1). */
  progress: number;
  isPastDue: boolean;
};

export function pregnancyStatus(lmpYmd: string, todayYmd: string): PregnancyStatus {
  const ga = gestationalAge(lmpYmd, todayYmd);
  const dueDate = dueDateFromLmp(lmpYmd);
  const daysToDue = diffDaysYmd(todayYmd, dueDate);
  return {
    ...ga,
    trimester: trimesterForWeeks(ga.weeks),
    dueDate,
    daysToDue,
    progress: Math.min(1, Math.max(0, ga.totalDays / PREGNANCY_LENGTH_DAYS)),
    isPastDue: daysToDue < 0,
  };
}

export type DatingError = 'invalid' | 'future' | 'too-old';

export function validateLmp(lmpYmd: unknown, todayYmd: string): DatingError | null {
  if (!isValidYmd(lmpYmd)) return 'invalid';
  const days = diffDaysYmd(lmpYmd, todayYmd);
  if (days < 0) return 'future';
  if (days > MAX_GESTATION_WEEKS * 7) return 'too-old';
  return null;
}

export function validateGestationalAge(weeks: unknown, days: unknown): DatingError | null {
  if (!Number.isInteger(weeks) || !Number.isInteger(days)) return 'invalid';
  const w = weeks as number;
  const d = days as number;
  if (w < 0 || w > MAX_INPUT_WEEKS || d < 0 || d > 6) return 'invalid';
  return null;
}

/** Hebrew label, e.g. "שבוע 12+3". */
export function formatGestationalAge(weeks: number, days: number): string {
  return `שבוע ${weeks}+${days}`;
}
