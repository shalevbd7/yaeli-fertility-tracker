import { addDays, toISODate } from './dates';
import type { CalendarEvent, CycleMetrics, Medication, ResolvedStage, Stage } from './types';

// Cycle day + current stage, computed from the browser's local date.
export function computeCycleMetrics(
  hasCycle: boolean,
  cycleStartDate: string,
  stages: Stage[]
): CycleMetrics {
  if (!hasCycle || !cycleStartDate) return { cycleDay: 0, currentStage: null };
  const start = new Date(cycleStartDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Find what stage corresponds to today
  const current = stages.find(s => {
    const stageStart = s.relativeStartDay;
    const stageEnd = s.relativeStartDay + (s.durationDays || 1) - 1;
    return diffDays >= stageStart && diffDays <= stageEnd;
  });

  return {
    cycleDay: diffDays > 0 ? diffDays : 0,
    currentStage: current || null,
    isBefore: diffDays < 1
  };
}

// Stages with absolute dates and status, sorted by start day.
export function resolveStages(
  stages: Stage[],
  cycleStartDate: string,
  medications: Medication[]
): ResolvedStage[] {
  if (!cycleStartDate) return [];
  const baseDate = new Date(cycleStartDate + 'T00:00:00');

  return stages.map(stg => {
    const startDate = addDays(baseDate, stg.relativeStartDay - 1);
    const endDate = addDays(startDate, Math.max(0, (stg.durationDays || 1) - 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCompleted = today > endDate;
    const isCurrent = today >= startDate && today <= endDate;
    const isUpcoming = today < startDate;

    const linkedMed = medications.find(m => m.id === stg.medicationId);

    return {
      ...stg,
      startDate,
      endDate,
      isCompleted,
      isCurrent,
      isUpcoming,
      linkedMed
    };
  }).sort((a, b) => a.relativeStartDay - b.relativeStartDay);
}

// Map of YYYY-MM-DD -> events shown in the calendar grid.
export function buildCalendarEvents(
  resolvedStages: ResolvedStage[],
  hasCycle: boolean,
  medications: Medication[]
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  if (!hasCycle) return map;

  resolvedStages.forEach(stg => {
    const cur = new Date(stg.startDate);
    const end = new Date(stg.endDate);

    while (cur <= end) {
      const key = toISODate(cur);
      if (!map[key]) map[key] = [];
      map[key].push({
        id: stg.id,
        title: stg.title,
        type: stg.type,
        color: stg.color,
        med: stg.linkedMed
      });
      cur.setDate(cur.getDate() + 1);
    }
  });

  // Continuous medications are not shown in the calendar yet (existing behavior).
  void medications;

  return map;
}
