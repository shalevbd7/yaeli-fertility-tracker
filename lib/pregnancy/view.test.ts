import { describe, expect, it } from 'vitest';
import { buildTestRows, formatYmd, newId, testWindowDates, upcomingTests } from './view';
import type { StandardTest } from '@/lib/content/pregnancy/types';

const std = (key: string, fromWeek: number, toWeek: number, kind: StandardTest['kind'] = 'routine'): StandardTest => ({
  key, name: key, fromWeek, toWeek, windowLabel: '', kind, description: '', sources: ['moh-tests'],
});

const lmp = '2026-01-01';
const tests = [std('nt', 11, 13), std('anatomy', 20, 24), std('nipt', 10, 40, 'optional'), std('gbs', 36, 37)];

describe('formatYmd', () => {
  it('formats without timezone shifts', () => {
    expect(formatYmd('2026-11-13')).toBe('13/11/2026');
    expect(formatYmd('')).toBe('');
  });
});

describe('testWindowDates', () => {
  it('covers fromWeek+0 to toWeek+6', () => {
    expect(testWindowDates(lmp, { fromWeek: 11, toWeek: 13 })).toEqual({ from: '2026-03-19', to: '2026-04-08' });
  });
});

describe('buildTestRows / upcomingTests', () => {
  it('derives status from records and windows', () => {
    const today = '2026-03-25'; // 11+6
    const rows = buildTestRows(
      tests,
      [
        { id: 'pt-1', standardKey: 'anatomy', name: '', date: '2026-05-25', location: 'מכון', done: false, notes: '' },
        { id: 'pt-2', standardKey: '', name: 'בדיקת עיניים', date: '2026-04-01', location: '', done: false, notes: '' },
        { id: 'pt-3', standardKey: 'gbs', name: '', date: '', location: '', done: true, notes: '' },
      ],
      lmp,
      today
    );
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.status]));
    expect(byKey).toEqual({ nt: 'due-now', anatomy: 'scheduled', nipt: 'due-now', gbs: 'done', 'pt-2': 'scheduled' });

    // Optional tests without a record aren't pushed on the home screen.
    expect(upcomingTests(rows).map((r) => r.key)).toEqual(['nt', 'pt-2', 'anatomy']);
  });

  it('marks a missed window as past', () => {
    const rows = buildTestRows([std('nt', 11, 13)], [], lmp, '2026-06-01');
    expect(rows[0].status).toBe('past');
    expect(upcomingTests(rows)).toEqual([]);
  });
});

describe('newId', () => {
  it('produces server-valid ids', () => {
    expect(newId('pt')).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(newId('pt')).not.toBe(newId('pt'));
  });
});
