"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STAGES, INITIAL_MEDICATIONS } from '@/lib/tracker/defaults';
import { toISODate } from '@/lib/tracker/dates';
import type { Medication, Stage, TrackerPayload } from '@/lib/tracker/types';

/**
 * Tracker state + cloud sync (load on mount, debounced autosave).
 * Saving is blocked until a successful load, and every save carries the
 * loaded version so the server can reject stale writes (see /api/tracker).
 */
export function useTrackerData(showToast: (message: string, type?: string) => void) {
  // State: Period Cycle
  const [hasCycle, setHasCycle] = useState(true);
  const [cycleStartDate, setCycleStartDate] = useState(() => {
    // Default to 4 days ago to show an active cycle right away
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return toISODate(d);
  });

  // State: Medications and Stages
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);

  // Checklist for today's completed tasks
  const [completedItems, setCompletedItems] = useState<Record<string, string>>({});

  // Database sync state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // True when the server says this account has no tracker access (partner
  // waiting for approval / unlinked). Not an error: the page shows a status screen.
  const [noAccess, setNoAccess] = useState(false);
  // Saving is allowed only after a SUCCESSFUL load. If loading fails we must
  // never autosave, or default state would overwrite the real data.
  const hasLoadedRef = useRef(false);
  // `updatedAt` of the server document we last loaded/saved (version stamp).
  const baseUpdatedAtRef = useRef<string | null>(null);
  // JSON of the payload the server is known to hold — used to skip no-op saves.
  const lastSavedJsonRef = useRef<string | null>(null);
  // Set after a load with data: the next autosave run records a baseline instead of saving.
  const baselinePendingRef = useRef(false);
  // Saves are serialized: while one is in flight, only the latest payload is queued.
  const saveInFlightRef = useRef(false);
  const queuedPayloadRef = useRef<TrackerPayload | null>(null);
  // Bumping this re-runs the load effect (retry button / after a conflict).
  const [reloadKey, setReloadKey] = useState(0);
  // Non-zero while a deliberate "delete the last stage/medication" is waiting to
  // be saved; such saves carry `confirmClear: true` so the server allows
  // emptying the tracker. Each mark gets a new number so a mark made during an
  // in-flight save isn't cleared by that save's success.
  const deliberateClearRef = useRef(0);
  const clearCounterRef = useRef(0);

  const markDeliberateClear = useCallback(() => {
    clearCounterRef.current += 1;
    deliberateClearRef.current = clearCounterRef.current;
  }, []);

  const saveToDatabase = useCallback(async (payload: TrackerPayload) => {
    if (!hasLoadedRef.current) return;
    if (saveInFlightRef.current) {
      queuedPayloadRef.current = payload;
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    let next: TrackerPayload | null = payload;
    try {
      while (next && hasLoadedRef.current) {
        const current: TrackerPayload = next;
        next = null;
        const json = JSON.stringify(current);
        if (json === lastSavedJsonRef.current) {
          next = queuedPayloadRef.current;
          queuedPayloadRef.current = null;
          continue;
        }

        const sentClearMark = deliberateClearRef.current;
        const res = await fetch('/api/tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...current,
            baseUpdatedAt: baseUpdatedAtRef.current,
            ...(sentClearMark ? { confirmClear: true } : {}),
          }),
        });

        if (res.status === 409) {
          // The data changed elsewhere (another device / tab). Stop saving and reload.
          hasLoadedRef.current = false;
          queuedPayloadRef.current = null;
          showToast('הנתונים עודכנו ממכשיר אחר. טוענים את הגרסה העדכנית...', 'error');
          setReloadKey(k => k + 1);
          return;
        }
        if (res.status === 422) {
          queuedPayloadRef.current = null;
          setSaveError('השמירה נחסמה כדי לא למחוק את כל השלבים והתרופות.');
          showToast('השמירה נחסמה כדי לא למחוק את כל הנתונים.', 'error');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to save data');
        }

        const saved = await res.json();
        baseUpdatedAtRef.current = saved?.updatedAt ?? null;
        lastSavedJsonRef.current = json;
        if (sentClearMark && deliberateClearRef.current === sentClearMark) {
          deliberateClearRef.current = 0;
        }

        next = queuedPayloadRef.current;
        queuedPayloadRef.current = null;
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError('שמירה בענן נכשלה. הנתונים נשמרים מקומית עד לחיבור מחדש.');
      showToast('שגיאה בשמירה לענן. נסי שוב בעוד רגע.', 'error');
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }, [showToast]);

  // Load tracker data from MongoDB on mount (and on retry / after a conflict)
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      hasLoadedRef.current = false;
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/tracker');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          if (!cancelled) setNoAccess(true);
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to load data');
        }
        if (!cancelled) setNoAccess(false);
        const data = await res.json();
        if (cancelled) return;

        baseUpdatedAtRef.current = data?.updatedAt ?? null;
        lastSavedJsonRef.current = null;
        // When data exists, the state updates below always change `completedItems`
        // (new object), so the autosave effect is guaranteed to run once with the
        // loaded state — it records that as the baseline instead of re-saving it.
        baselinePendingRef.current = Boolean(data);
        deliberateClearRef.current = 0;

        if (data) {
          setHasCycle(data.hasActiveCycle ?? false);
          if (data.cycleStartDate) {
            setCycleStartDate(toISODate(new Date(data.cycleStartDate)));
          }
          if (Array.isArray(data.medications) && data.medications.length > 0) {
            setMedications(data.medications);
          }
          if (Array.isArray(data.stages) && data.stages.length > 0) {
            setStages(data.stages);
          }
          if (data.completedTasks && typeof data.completedTasks === 'object') {
            setCompletedItems({ ...data.completedTasks });
          }
        }
        // Only a successful load enables saving.
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Load failed:', err);
        if (!cancelled) {
          setLoadError('לא הצלחנו לטעון נתונים מהענן. שינויים לא יישמרו עד שהטעינה תצליח.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Auto-save to MongoDB when state changes (debounced)
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const payload: TrackerPayload = {
      hasActiveCycle: hasCycle,
      cycleStartDate: cycleStartDate ? new Date(cycleStartDate + 'T00:00:00').toISOString() : null,
      stages,
      medications,
      completedTasks: completedItems,
    };

    if (baselinePendingRef.current) {
      // First run right after a load: this is the server's data, nothing to save.
      baselinePendingRef.current = false;
      lastSavedJsonRef.current = JSON.stringify(payload);
      return;
    }

    const timer = setTimeout(() => {
      saveToDatabase(payload);
    }, 800);

    return () => clearTimeout(timer);
  }, [hasCycle, cycleStartDate, stages, medications, completedItems, saveToDatabase]);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  return {
    hasCycle, setHasCycle,
    cycleStartDate, setCycleStartDate,
    medications, setMedications,
    stages, setStages,
    completedItems, setCompletedItems,
    isLoading, isSaving, loadError, saveError, noAccess,
    reload,
    markDeliberateClear,
  };
}
