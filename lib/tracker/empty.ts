/**
 * A tracker is "completely empty" (a brand-new account → show onboarding)
 * only when it has no fertility data at all, was never switched to
 * pregnancy, and has no pregnancy data. Any existing user with data is
 * never empty, so never sees onboarding.
 */
export type TrackerLike = {
  cycleStartDate?: unknown;
  stages?: unknown[] | null;
  medications?: unknown[] | null;
  completedTasks?: unknown;
  mode?: string | null;
  pregnancy?: unknown;
};

function mapSize(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Map) return value.size;
  if (typeof value === 'object') return Object.keys(value as object).length;
  return 0;
}

export function isTrackerEmpty(doc: TrackerLike | null | undefined): boolean {
  if (!doc) return true;
  return (
    !doc.cycleStartDate &&
    (doc.stages?.length ?? 0) === 0 &&
    (doc.medications?.length ?? 0) === 0 &&
    mapSize(doc.completedTasks) === 0 &&
    (doc.mode ?? 'fertility') === 'fertility' &&
    !doc.pregnancy
  );
}
