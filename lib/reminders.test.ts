import { describe, expect, it } from 'vitest';
import { reminderMessage, remindersForTracker, type CronTracker } from './reminders';

const ctx = (hour: string, weekday = 5) => ({ todayYmd: '2026-11-13', currentHour: hour, weekday });

// An existing fertility tracker, shaped like the real data (no new fields).
const fertility: CronTracker = {
  userId: 'yaeli-1',
  hasActiveCycle: true,
  cycleStartDate: '2026-11-10T00:00:00.000Z', // today = cycle day 4
  stages: [
    { relativeStartDay: 3, durationDays: 5, medicationId: 'med-2' },
    { relativeStartDay: 16, durationDays: 14, medicationId: 'med-4' },
  ],
  medications: [
    { id: 'med-1', name: 'חומצה פולית', dosage: 'טבליה 1', hours: ['08:30'], isContinuous: true, notes: 'בבוקר' },
    { id: 'med-2', name: 'לטרוזול', dosage: '2 כדורים', hours: ['20:30'], isContinuous: false, notes: '' },
    { id: 'med-4', name: 'אוטרוגסטן', dosage: 'נר 1', hours: ['08:00', '21:30'], isContinuous: false, notes: '' },
  ],
  completedTasks: {},
};

describe('fertility reminders (existing behavior)', () => {
  it('keeps the exact original message text', () => {
    expect(reminderMessage({ name: 'X', dosage: 'Y', notes: 'Z' })).toBe(
      'היי יעלי אהובה שלי ❤️\nתזכורת אוטומטית לקחת X (Y).\nהערה: Z\nאוהב המון! ✨'
    );
    expect(reminderMessage({ name: 'X', dosage: 'Y', notes: '' })).toBe(
      'היי יעלי אהובה שלי ❤️\nתזכורת אוטומטית לקחת X (Y).\n\nאוהב המון! ✨'
    );
  });

  it('reminds continuous meds and the current stage med at their hour', () => {
    expect(remindersForTracker(fertility, ctx('08'))).toHaveLength(1); // folic acid
    expect(remindersForTracker(fertility, ctx('20'))).toHaveLength(1); // letrozole (stage day 3–7)
    expect(remindersForTracker(fertility, ctx('21'))).toEqual([]); // progesterone stage not current
  });

  it('skips a med already ticked today, as before', () => {
    expect(remindersForTracker({ ...fertility, completedTasks: { 'med-1': '2026-11-13' } }, ctx('08'))).toEqual([]);
  });

  it('sends nothing without an active cycle', () => {
    expect(remindersForTracker({ ...fertility, hasActiveCycle: false }, ctx('08'))).toEqual([]);
  });

  it('treats a missing mode as fertility', () => {
    expect(remindersForTracker({ ...fertility, mode: undefined }, ctx('08'))).toHaveLength(1);
    expect(remindersForTracker({ ...fertility, mode: 'fertility' }, ctx('08'))).toHaveLength(1);
  });
});

describe('pregnancy reminders', () => {
  const pregnant: CronTracker = {
    ...fertility,
    mode: 'pregnancy',
    pregnancy: {
      medications: [
        { id: 'pmed-1', name: 'ויטמין', dosage: 'כמוסה', hours: ['08:00', '20:00'], schedule: 'daily', notes: '' },
        { id: 'pmed-2', name: 'ברזל', dosage: '1', hours: ['09:00'], schedule: 'weekly', weekdays: [0], notes: '' },
        { id: 'pmed-3', name: 'נגד צרבת', dosage: '1', hours: ['12:00'], schedule: 'asNeeded', notes: '' },
      ],
      doseLog: { 'pmed-1@08:00': '2026-11-13' },
    },
  };

  it('stops fertility reminders while in pregnancy mode', () => {
    // 08:30 folic acid (fertility) must not be sent; 08:00 pregnancy dose already taken.
    expect(remindersForTracker(pregnant, ctx('08'))).toEqual([]);
  });

  it('still sends the evening dose after the morning dose was taken', () => {
    expect(remindersForTracker(pregnant, ctx('20'))).toEqual([
      reminderMessage({ name: 'ויטמין', dosage: 'כמוסה', notes: '' }),
    ]);
  });

  it('sends weekly doses only on their weekday and never as-needed ones', () => {
    expect(remindersForTracker(pregnant, ctx('09', 0))).toHaveLength(1);
    expect(remindersForTracker(pregnant, ctx('09', 1))).toEqual([]);
    expect(remindersForTracker(pregnant, ctx('12', 0))).toEqual([]);
  });

  it('reads a Mongo Map doseLog', () => {
    const withMap = { ...pregnant, pregnancy: { ...pregnant.pregnancy, doseLog: new Map([['pmed-1@20:00', '2026-11-13']]) } };
    expect(remindersForTracker(withMap, ctx('20'))).toEqual([]);
  });
});
