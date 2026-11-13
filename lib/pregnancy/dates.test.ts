import { describe, expect, it } from 'vitest';
import { addDaysYmd, diffDaysYmd, isValidYmd, weekdayOfYmd } from '@/lib/israel-date';
import {
  dueDateFromLmp,
  formatGestationalAge,
  gestationalAge,
  lmpFromGestationalAge,
  pregnancyStatus,
  trimesterForWeeks,
  validateGestationalAge,
  validateLmp,
} from './dates';

describe('ymd helpers', () => {
  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDaysYmd('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysYmd('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysYmd('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is unaffected by daylight-saving changes', () => {
    // Israel moves clocks around late March / late October.
    expect(diffDaysYmd('2026-03-20', '2026-03-30')).toBe(10);
    expect(diffDaysYmd('2026-10-20', '2026-10-30')).toBe(10);
  });

  it('validates dates', () => {
    expect(isValidYmd('2026-02-29')).toBe(false);
    expect(isValidYmd('2028-02-29')).toBe(true);
    expect(isValidYmd('2026-13-01')).toBe(false);
    expect(isValidYmd('26-01-01')).toBe(false);
    expect(isValidYmd(undefined)).toBe(false);
  });

  it('computes the weekday of a date', () => {
    expect(weekdayOfYmd('2026-11-13')).toBe(5); // Friday
    expect(weekdayOfYmd('2026-11-15')).toBe(0); // Sunday
  });
});

describe('due date = LMP + 280 days', () => {
  it('computes the due date', () => {
    expect(dueDateFromLmp('2026-01-01')).toBe('2026-10-08');
    expect(dueDateFromLmp('2028-02-01')).toBe('2028-11-07'); // leap year
    expect(diffDaysYmd('2026-05-10', dueDateFromLmp('2026-05-10'))).toBe(280);
  });
});

describe('week + days ↔ LMP', () => {
  it('derives the LMP from "I am X weeks + Y days"', () => {
    expect(lmpFromGestationalAge('2026-11-13', 0, 0)).toBe('2026-11-13');
    expect(lmpFromGestationalAge('2026-11-13', 12, 3)).toBe('2026-08-18'); // 87 days earlier
  });

  it('round-trips: entering week 12+3 gives back 12+3 today', () => {
    const today = '2026-11-13';
    for (const [w, d] of [[0, 0], [4, 6], [12, 3], [27, 6], [40, 0], [41, 5]]) {
      const lmp = lmpFromGestationalAge(today, w, d);
      expect(gestationalAge(lmp, today)).toEqual({ totalDays: w * 7 + d, weeks: w, days: d });
    }
  });

  it('formats as week+days', () => {
    expect(formatGestationalAge(12, 3)).toBe('שבוע 12+3');
  });
});

describe('trimesters (NHS: 1st to end of week 12, 2nd 13–27, 3rd 28+)', () => {
  it('maps weeks to trimesters at the boundaries', () => {
    expect(trimesterForWeeks(0)).toBe(1);
    expect(trimesterForWeeks(12)).toBe(1);
    expect(trimesterForWeeks(13)).toBe(2);
    expect(trimesterForWeeks(27)).toBe(2);
    expect(trimesterForWeeks(28)).toBe(3);
    expect(trimesterForWeeks(42)).toBe(3);
  });
});

describe('pregnancyStatus', () => {
  it('reports week, trimester, due date and progress', () => {
    const lmp = '2026-08-11';
    const s = pregnancyStatus(lmp, '2026-11-13');
    expect(s.weeks).toBe(13);
    expect(s.days).toBe(3);
    expect(s.trimester).toBe(2);
    expect(s.dueDate).toBe('2027-05-18');
    expect(s.daysToDue).toBe(280 - 94);
    expect(s.progress).toBeCloseTo(94 / 280);
    expect(s.isPastDue).toBe(false);
  });

  it('handles the due date and after it', () => {
    const lmp = '2026-01-01';
    expect(pregnancyStatus(lmp, '2026-10-08')).toMatchObject({ daysToDue: 0, weeks: 40, days: 0, progress: 1, isPastDue: false });
    expect(pregnancyStatus(lmp, '2026-10-10')).toMatchObject({ daysToDue: -2, isPastDue: true, progress: 1 });
  });
});

describe('input validation', () => {
  const today = '2026-11-13';
  it('rejects future, too-old and invalid LMP dates', () => {
    expect(validateLmp('2026-11-14', today)).toBe('future');
    expect(validateLmp(addDaysYmd(today, -(44 * 7 + 1)), today)).toBe('too-old');
    expect(validateLmp('nope', today)).toBe('invalid');
    expect(validateLmp(today, today)).toBeNull();
    expect(validateLmp(addDaysYmd(today, -(44 * 7)), today)).toBeNull();
  });

  it('accepts 0+0 … 42+6 only', () => {
    expect(validateGestationalAge(0, 0)).toBeNull();
    expect(validateGestationalAge(42, 6)).toBeNull();
    expect(validateGestationalAge(43, 0)).toBe('invalid');
    expect(validateGestationalAge(12, 7)).toBe('invalid');
    expect(validateGestationalAge(-1, 0)).toBe('invalid');
    expect(validateGestationalAge(12.5, 0)).toBe('invalid');
  });
});
