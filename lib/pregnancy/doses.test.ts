import { describe, expect, it } from 'vitest';
import { doseKey, dosesDueThisHour, dosesForDay, isDoseTaken, normalizeTimes, scheduleOf } from './doses';

const today = '2026-11-13';
const twiceDaily = { id: 'pmed-1', hours: ['20:00', '08:00'], schedule: 'daily' };
const weeklySunWed = { id: 'pmed-2', hours: ['09:30'], schedule: 'weekly', weekdays: [0, 3] };
const asNeeded = { id: 'pmed-3', hours: ['10:00'], schedule: 'asNeeded' };
const legacy = { id: 'med-1', hours: ['08:30'] }; // fertility-style med, no schedule field

describe('times', () => {
  it('keeps valid HH:MM times, sorted and unique', () => {
    expect(normalizeTimes(['20:00', '08:00', '08:00', ' 09:15 ', '25:00', '8:00', '', 7])).toEqual(['08:00', '09:15', '20:00']);
  });
});

describe('schedules', () => {
  it('defaults to daily when no schedule is set', () => {
    expect(scheduleOf(legacy)).toBe('daily');
    expect(dosesForDay(legacy, 2)).toEqual(['08:30']);
  });

  it('lists both daily doses every day', () => {
    expect(dosesForDay(twiceDaily, 0)).toEqual(['08:00', '20:00']);
    expect(dosesForDay(twiceDaily, 6)).toEqual(['08:00', '20:00']);
  });

  it('schedules weekly meds only on the chosen weekdays', () => {
    expect(dosesForDay(weeklySunWed, 0)).toEqual(['09:30']);
    expect(dosesForDay(weeklySunWed, 3)).toEqual(['09:30']);
    expect(dosesForDay(weeklySunWed, 1)).toEqual([]);
  });

  it('never schedules as-needed meds', () => {
    expect(dosesForDay(asNeeded, 0)).toEqual([]);
  });
});

describe('each dose is tracked separately', () => {
  it('taking the 08:00 dose does not mark the 20:00 dose', () => {
    const doseLog = { [doseKey('pmed-1', '08:00')]: today };
    expect(isDoseTaken(doseLog, 'pmed-1', '08:00', today)).toBe(true);
    expect(isDoseTaken(doseLog, 'pmed-1', '20:00', today)).toBe(false);
  });

  it('a dose taken yesterday is not taken today', () => {
    const doseLog = { [doseKey('pmed-1', '08:00')]: '2026-11-12' };
    expect(isDoseTaken(doseLog, 'pmed-1', '08:00', today)).toBe(false);
  });
});

describe('dosesDueThisHour (reminders)', () => {
  const meds = [twiceDaily, weeklySunWed, asNeeded];

  it('still reminds at 20:00 after the morning dose was taken', () => {
    const doseLog = { [doseKey('pmed-1', '08:00')]: today };
    expect(dosesDueThisHour(meds, doseLog, today, '08', 5)).toEqual([]);
    expect(dosesDueThisHour(meds, doseLog, today, '20', 5).map((d) => d.time)).toEqual(['20:00']);
  });

  it('reminds at 08:00 when not taken yet', () => {
    expect(dosesDueThisHour(meds, {}, today, '08', 5).map((d) => `${d.med.id}@${d.time}`)).toEqual(['pmed-1@08:00']);
  });

  it('reminds weekly meds only on their days, never as-needed meds', () => {
    expect(dosesDueThisHour(meds, {}, today, '09', 3).map((d) => d.med.id)).toEqual(['pmed-2']);
    expect(dosesDueThisHour(meds, {}, today, '09', 4)).toEqual([]);
    expect(dosesDueThisHour(meds, {}, today, '10', 0)).toEqual([]);
  });
});
