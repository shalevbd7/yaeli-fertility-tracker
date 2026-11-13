import { NextResponse } from 'next/server';
import { getTrackerAccess, type TrackerAccess } from '@/lib/access';
import { isTrackerEmpty } from '@/lib/tracker/empty';
import { DEFAULT_STAGES, INITIAL_MEDICATIONS } from '@/lib/tracker/defaults';

/**
 * The tracker the caller may access: the owner's own tracker, or for an
 * approved partner the owner's tracker. Pending/unlinked partners get 403.
 */
export async function resolveTrackerAccess(
  { ownerOnly = false }: { ownerOnly?: boolean } = {}
): Promise<
  | { access: TrackerAccess; userId: string; error?: undefined }
  | { access?: undefined; userId?: undefined; error: NextResponse }
> {
  const access = await getTrackerAccess();
  if (!access) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!access.trackerUserId) {
    return { error: NextResponse.json({ error: 'no-access', role: access.role }, { status: 403 }) };
  }
  if (ownerOnly && access.role !== 'owner') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { access, userId: access.trackerUserId };
}

export type TrackerLean = {
  hasActiveCycle?: boolean;
  cycleStartDate?: Date | null;
  stages?: unknown[];
  medications?: unknown[];
  completedTasks?: unknown;
  mode?: string | null;
  fertilityArchivedAt?: Date | null;
  pregnancy?: {
    lmpDate?: string;
    startedAt?: Date | null;
    tests?: unknown[];
    symptomLog?: unknown[];
    medications?: unknown[];
    doseLog?: unknown;
    asNeededLog?: unknown[];
  } | null;
  updatedAt?: Date | null;
};

function mapToObject(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

/** Explicit field mapping of the tracker document sent to the client. */
export function toResponseBody(doc: TrackerLean) {
  const p = doc.pregnancy;
  return {
    hasActiveCycle: doc.hasActiveCycle ?? false,
    cycleStartDate: doc.cycleStartDate ?? null,
    stages: doc.stages ?? [],
    medications: doc.medications ?? [],
    completedTasks: mapToObject(doc.completedTasks),
    // Pregnancy mode (missing on existing documents → fertility)
    mode: doc.mode === 'pregnancy' ? 'pregnancy' : 'fertility',
    fertilityArchivedAt: doc.fertilityArchivedAt ?? null,
    pregnancy: p
      ? {
          lmpDate: p.lmpDate ?? '',
          startedAt: p.startedAt ?? null,
          tests: p.tests ?? [],
          symptomLog: p.symptomLog ?? [],
          medications: p.medications ?? [],
          doseLog: mapToObject(p.doseLog),
          asNeededLog: p.asNeededLog ?? [],
        }
      : null,
    // True only for a brand-new account with no data → the app shows onboarding.
    isEmpty: isTrackerEmpty(doc),
    // Version stamp: the client must send it back as `baseUpdatedAt` on save.
    updatedAt: doc.updatedAt ?? null,
  };
}

/** Fields for a brand-new tracker created from onboarding. */
export function initialTrackerFields(
  userId: string,
  choice: 'fertility' | 'pregnancy',
  lmpDate?: string
) {
  return {
    userId,
    // The default protocol, waiting for the first period date (not an
    // "active cycle", so no reminders until she starts tracking).
    hasActiveCycle: false,
    cycleStartDate: null,
    stages: DEFAULT_STAGES,
    medications: INITIAL_MEDICATIONS,
    completedTasks: {},
    mode: choice,
    ...(choice === 'pregnancy'
      ? {
          fertilityArchivedAt: new Date(),
          pregnancy: {
            lmpDate,
            startedAt: new Date(),
            tests: [],
            symptomLog: [],
            medications: [],
            doseLog: {},
            asNeededLog: [],
          },
        }
      : {}),
  };
}
