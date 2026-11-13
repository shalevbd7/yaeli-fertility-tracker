import { describe, expect, it } from 'vitest';
import { isTrackerEmpty } from './empty';
import { sanitizePregnancyEditable } from '@/lib/pregnancy/sanitize';

describe('isTrackerEmpty (onboarding only for brand-new accounts)', () => {
  it('is empty for a missing document or one with nothing in it', () => {
    expect(isTrackerEmpty(null)).toBe(true);
    expect(isTrackerEmpty({ stages: [], medications: [], completedTasks: {} })).toBe(true);
    expect(isTrackerEmpty({ completedTasks: new Map() })).toBe(true);
  });

  it('is never empty for a user with any data', () => {
    expect(isTrackerEmpty({ stages: [{ id: 's' }] })).toBe(false);
    expect(isTrackerEmpty({ medications: [{ id: 'm' }] })).toBe(false);
    expect(isTrackerEmpty({ cycleStartDate: new Date() })).toBe(false);
    expect(isTrackerEmpty({ completedTasks: { 'med-1': '2026-01-01' } })).toBe(false);
    expect(isTrackerEmpty({ completedTasks: new Map([['med-1', '2026-01-01']]) })).toBe(false);
    expect(isTrackerEmpty({ mode: 'pregnancy' })).toBe(false);
    expect(isTrackerEmpty({ pregnancy: { lmpDate: '2026-01-01' } })).toBe(false);
  });

  it('treats a real-looking existing user (default protocol) as not empty', () => {
    expect(
      isTrackerEmpty({
        cycleStartDate: '2026-11-01T00:00:00.000Z',
        stages: [{ id: 'stg-1' }, { id: 'stg-2' }],
        medications: [{ id: 'med-1' }],
        completedTasks: {},
      })
    ).toBe(false);
  });
});

describe('sanitizePregnancyEditable', () => {
  it('keeps valid data and normalizes medications', () => {
    const out = sanitizePregnancyEditable({
      tests: [{ id: 'pt-1', name: 'סקירה', date: '2026-12-01', location: 'קופה', done: true, extra: 'x' }],
      symptomLog: [{ id: 'sl-1', symptomKey: 'nausea', date: '2026-11-13', note: '' }],
      medications: [{ id: 'pmed-1', name: 'ויטמין', hours: ['20:00', '08:00', 'bad'], schedule: 'daily' }],
      doseLog: { 'pmed-1@08:00': '2026-11-13', 'bad key': '2026-11-13', 'pmed-1@20:00': 'nope' },
      asNeededLog: [{ id: 'an-1', medId: 'pmed-1', at: '2026-11-13T08:00:00.000Z' }],
    });
    expect(out.tests[0]).toEqual({
      id: 'pt-1', standardKey: '', name: 'סקירה', date: '2026-12-01', location: 'קופה', done: true, notes: '',
    });
    expect(out.medications[0]).toMatchObject({ hours: ['08:00', '20:00'], timesPerDay: 2, schedule: 'daily', weekdays: [] });
    expect(out.doseLog).toEqual({ 'pmed-1@08:00': '2026-11-13' });
    expect(out.symptomLog).toHaveLength(1);
    expect(out.asNeededLog).toHaveLength(1);
  });

  it('drops invalid entries and handles garbage input', () => {
    expect(sanitizePregnancyEditable(null)).toEqual({ tests: [], symptomLog: [], medications: [], doseLog: {}, asNeededLog: [] });
    const out = sanitizePregnancyEditable({
      tests: [{ name: 'no id' }],
      symptomLog: [{ id: 'x', date: 'bad' }],
      medications: [{ id: 'm.1' }],
    });
    expect(out.tests).toEqual([]);
    expect(out.symptomLog).toEqual([]);
    expect(out.medications).toEqual([]);
  });

  it('keeps only valid weekdays for weekly medications', () => {
    const out = sanitizePregnancyEditable({
      medications: [{ id: 'pmed-2', hours: ['09:00'], schedule: 'weekly', weekdays: [3, 0, 3, 9, -1, 1.5] }],
    });
    expect(out.medications[0].weekdays).toEqual([0, 3]);
  });
});
