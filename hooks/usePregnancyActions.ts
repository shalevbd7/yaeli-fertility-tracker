"use client";

import { useCallback } from 'react';
import type React from 'react';
import { doseKey } from '@/lib/pregnancy/doses';
import { newId } from '@/lib/pregnancy/view';
import type { Medication, PregnancyData, PregnancyTest, SymptomLogEntry } from '@/lib/tracker/types';

type Toast = (message: string, type?: string) => void;

const MODE_ERRORS: Record<string, string> = {
  'invalid-date': 'התאריך אינו תקין.',
  'already-pregnancy': 'המעקב כבר במצב הריון.',
  'not-pregnancy': 'המעקב אינו במצב הריון.',
  'not-empty': 'למעקב כבר יש נתונים.',
  forbidden: 'רק בעלת המעקב יכולה לשנות את מצב ההריון.',
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/**
 * Pregnancy edits (autosaved with the rest of the tracker) and the owner-only
 * mode actions (separate API; the app reloads afterwards).
 */
export function usePregnancyActions(
  setPregnancy: React.Dispatch<React.SetStateAction<PregnancyData | null>>,
  showToast: Toast,
  reload: () => void,
  todayYmd: string
) {
  const update = useCallback(
    (fn: (p: PregnancyData) => PregnancyData) => setPregnancy((p) => (p ? fn(p) : p)),
    [setPregnancy]
  );

  // ----- Doses (each scheduled time separately) -----
  const toggleDose = useCallback(
    (med: Medication, time: string, taken: boolean) => {
      update((p) => {
        const doseLog = { ...p.doseLog };
        if (taken) doseLog[doseKey(med.id, time)] = todayYmd;
        else delete doseLog[doseKey(med.id, time)];
        return { ...p, doseLog };
      });
      if (taken) showToast(`כל הכבוד! ${med.name} (${time}) סומן ❤️`);
    },
    [update, showToast, todayYmd]
  );

  const takeAsNeeded = useCallback(
    (med: Medication) => {
      update((p) => ({
        ...p,
        asNeededLog: [...p.asNeededLog, { id: newId('an'), medId: med.id, at: new Date().toISOString() }].slice(-500),
      }));
      showToast(`נרשם: ${med.name}`);
    },
    [update, showToast]
  );

  // ----- Tests -----
  const saveTest = useCallback(
    (test: PregnancyTest) => {
      update((p) => {
        const exists = p.tests.some((t) => t.id === test.id);
        return { ...p, tests: exists ? p.tests.map((t) => (t.id === test.id ? test : t)) : [...p.tests, test] };
      });
      showToast('הבדיקה עודכנה');
    },
    [update, showToast]
  );

  const deleteTest = useCallback(
    (id: string) => {
      update((p) => ({ ...p, tests: p.tests.filter((t) => t.id !== id) }));
      showToast('הבדיקה הוסרה');
    },
    [update, showToast]
  );

  // ----- Symptoms -----
  const addSymptomLog = useCallback(
    (entry: SymptomLogEntry) => {
      update((p) => ({ ...p, symptomLog: [...p.symptomLog, entry].slice(-1000) }));
      showToast('נרשם ביומן 📓');
    },
    [update, showToast]
  );

  const deleteSymptomLog = useCallback(
    (id: string) => update((p) => ({ ...p, symptomLog: p.symptomLog.filter((e) => e.id !== id) })),
    [update]
  );

  // ----- Medications -----
  const saveMed = useCallback(
    (med: Medication) => {
      update((p) => {
        const exists = p.medications.some((m) => m.id === med.id);
        return { ...p, medications: exists ? p.medications.map((m) => (m.id === med.id ? med : m)) : [...p.medications, med] };
      });
      showToast('נשמר בהצלחה');
    },
    [update, showToast]
  );

  const deleteMed = useCallback(
    (id: string) => {
      update((p) => {
        const doseLog = Object.fromEntries(Object.entries(p.doseLog).filter(([k]) => !k.startsWith(`${id}@`)));
        return { ...p, medications: p.medications.filter((m) => m.id !== id), doseLog };
      });
      showToast('הוסר מהרשימה');
    },
    [update, showToast]
  );

  // ----- Owner-only mode changes -----
  const modeAction = useCallback(
    async (url: string, body: unknown, success: string) => {
      try {
        const { ok, data } = await postJson(url, body);
        if (!ok) {
          showToast(MODE_ERRORS[data?.error] ?? 'הפעולה נכשלה. נסי שוב בעוד רגע.', 'error');
          return;
        }
        showToast(success);
        reload();
      } catch {
        showToast('הפעולה נכשלה. נסי שוב בעוד רגע.', 'error');
      }
    },
    [showToast, reload]
  );

  const startPregnancy = useCallback(
    (lmpDate: string) => modeAction('/api/tracker/mode', { action: 'startPregnancy', lmpDate }, 'מזל טוב! עברנו למצב הריון 🤰❤️'),
    [modeAction]
  );
  const updateLmp = useCallback(
    (lmpDate: string) => modeAction('/api/tracker/mode', { action: 'updateLmp', lmpDate }, 'תאריך ההריון עודכן'),
    [modeAction]
  );
  const restoreFertility = useCallback(
    () => modeAction('/api/tracker/mode', { action: 'restoreFertility' }, 'חזרנו למעקב הפוריות. כל הנתונים במקומם.'),
    [modeAction]
  );
  const completeOnboarding = useCallback(
    (choice: 'fertility' | 'pregnancy', lmpDate?: string) =>
      modeAction('/api/tracker/onboarding', { choice, lmpDate }, choice === 'pregnancy' ? 'מזל טוב! 🤰❤️' : 'ברוכה הבאה ❤️'),
    [modeAction]
  );

  return {
    toggleDose,
    takeAsNeeded,
    saveTest,
    deleteTest,
    addSymptomLog,
    deleteSymptomLog,
    saveMed,
    deleteMed,
    startPregnancy,
    updateLmp,
    restoreFertility,
    completeOnboarding,
  };
}
