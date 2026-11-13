import { describe, expect, it } from 'vitest';
import { SOURCES, STANDARD_TESTS, SYMPTOMS, TRIMESTERS, WARNING_SIGNS, WEEKS, weekInfoFor } from './index';

describe('pregnancy content integrity', () => {
  const allItems = [...TRIMESTERS, ...WEEKS, ...STANDARD_TESTS, ...SYMPTOMS, ...WARNING_SIGNS];

  it('every item cites at least one known source', () => {
    for (const item of allItems) {
      expect(item.sources.length).toBeGreaterThan(0);
      for (const id of item.sources) expect(SOURCES[id], `unknown source ${id}`).toBeDefined();
    }
  });

  it('has one entry for every week from 4 to 41', () => {
    expect(WEEKS.map((w) => w.week)).toEqual(Array.from({ length: 38 }, (_, i) => i + 4));
  });

  it('returns a note for any week', () => {
    expect(weekInfoFor(0).week).toBe(0);
    expect(weekInfoFor(20).week).toBe(20);
    expect(weekInfoFor(43).week).toBe(42);
  });

  it('has unique test and symptom keys and sane windows', () => {
    expect(new Set(STANDARD_TESTS.map((t) => t.key)).size).toBe(STANDARD_TESTS.length);
    expect(new Set(SYMPTOMS.map((s) => s.key)).size).toBe(SYMPTOMS.length);
    for (const t of STANDARD_TESTS) expect(t.fromWeek).toBeLessThanOrEqual(t.toWeek);
  });

  it('contains no dosage recommendations (mg / mcg / units)', () => {
    const text = JSON.stringify(allItems);
    expect(text).not.toMatch(/\d+\s*(מ״ג|מ"ג|מק״ג|מק"ג|mg|mcg)/i);
  });
});
