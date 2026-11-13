import { addDaysYmd } from '@/lib/israel-date';
import type { StandardTest } from '@/lib/content/pregnancy/types';
import type { PregnancyTest } from '@/lib/tracker/types';

/** "2026-11-13" → "13/11/2026" (no Date parsing, so no timezone shifts). */
export function formatYmd(ymd: string | null | undefined): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const WEEKDAY_SHORT_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function weekdayNameHe(weekday: number): string {
  return WEEKDAYS_HE[weekday] ?? '';
}

/** Calendar dates of a test window (completed weeks fromWeek+0 … toWeek+6). */
export function testWindowDates(lmpYmd: string, test: Pick<StandardTest, 'fromWeek' | 'toWeek'>) {
  return { from: addDaysYmd(lmpYmd, test.fromWeek * 7), to: addDaysYmd(lmpYmd, test.toWeek * 7 + 6) };
}

export type TestStatus = 'done' | 'scheduled' | 'due-now' | 'upcoming' | 'past';

export type TestRow = {
  /** standardKey for standard tests, record id for custom tests. */
  key: string;
  name: string;
  standard?: StandardTest;
  record?: PregnancyTest;
  windowFrom?: string;
  windowTo?: string;
  status: TestStatus;
};

function statusFor(record: PregnancyTest | undefined, todayYmd: string, from?: string, to?: string): TestStatus {
  if (record?.done) return 'done';
  if (record?.date) return record.date >= todayYmd ? 'scheduled' : 'past';
  if (from && to) {
    if (todayYmd < from) return 'upcoming';
    if (todayYmd <= to) return 'due-now';
    return 'past';
  }
  return 'upcoming';
}

/** Standard tests (with the user's record, if any) followed by custom tests. */
export function buildTestRows(
  standards: StandardTest[],
  records: PregnancyTest[],
  lmpYmd: string,
  todayYmd: string
): TestRow[] {
  const rows: TestRow[] = standards.map((standard) => {
    const record = records.find((r) => r.standardKey === standard.key);
    const { from, to } = testWindowDates(lmpYmd, standard);
    return {
      key: standard.key,
      name: standard.name,
      standard,
      record,
      windowFrom: from,
      windowTo: to,
      status: statusFor(record, todayYmd, from, to),
    };
  });
  for (const record of records.filter((r) => !r.standardKey)) {
    rows.push({ key: record.id, name: record.name || 'בדיקה', record, status: statusFor(record, todayYmd) });
  }
  return rows;
}

/**
 * Next tests for the home screen: not done, scheduled or due now or upcoming,
 * routine standard tests or anything she added a record for; sorted by the
 * scheduled date, else by the start of the window.
 */
export function upcomingTests(rows: TestRow[], limit = 3): TestRow[] {
  const sortKey = (r: TestRow) => r.record?.date || r.windowFrom || '9999-12-31';
  return rows
    .filter((r) => r.status === 'scheduled' || r.status === 'due-now' || r.status === 'upcoming')
    .filter((r) => r.record || r.standard?.kind === 'routine')
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .slice(0, limit);
}

/** New unique id for client-created records (matches the server's id pattern). */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
