"use client";

import type React from 'react';
import { isTaskCompletedOnDate } from '@/lib/israel-date';
import { getColorClasses } from '@/lib/tracker/colors';
import { formatDateIsraeli, formatDayName, toISODate } from '@/lib/tracker/dates';
import type { CycleMetrics, Medication, ResolvedStage, TabId } from '@/lib/tracker/types';

type DashboardTabProps = {
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
  hasCycle: boolean;
  setHasCycle: React.Dispatch<React.SetStateAction<boolean>>;
  cycleStartDate: string;
  medications: Medication[];
  completedItems: Record<string, string>;
  setCompletedItems: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendingMedId: string | null;
  setIsResetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetDate: string;
  setResetDate: React.Dispatch<React.SetStateAction<string>>;
  resetTime: string;
  setResetTime: React.Dispatch<React.SetStateAction<string>>;
  showToast: (message: string, type?: string) => void;
  cycleMetrics: CycleMetrics;
  todayYmdIsrael: string;
  resolvedStages: ResolvedStage[];
  sendTelegramReminder: (med: Medication, customTime?: string) => void;
  handleConfirmReset: () => void;
};

export default function DashboardTab({ setActiveTab, hasCycle, setHasCycle, cycleStartDate, medications, completedItems, setCompletedItems, sendingMedId, setIsResetModalOpen, resetDate, setResetDate, resetTime, setResetTime, showToast, cycleMetrics, todayYmdIsrael, resolvedStages, sendTelegramReminder, handleConfirmReset }: DashboardTabProps) {
  return (
    <div className="space-y-6">

      {/* Condition 1: When cycle has NOT started yet */}
      {!hasCycle ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
            🌷
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              שלום אהבה שלי ❤️
            </h2>
            <p className="text-slate-600 mt-2 leading-relaxed">
              כאן אנחנו מחכים יחד לתחילת המחזור שלך. ברגע שתקבלי, לחצי על הכפתור למטה או בחרי תאריך, והמערכת תבנה מיד את כל לוח הזמנים המדויק עבורך, צעד אחרי צעד.
            </p>
          </div>

          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4 inline-block w-full text-right">
            <label className="block text-sm font-bold text-rose-900">
              מתי התחיל המחזור? (יום ושעה)
            </label>
            <p className="text-xs text-rose-700 mb-2">
              * שימי לב יעלי, אם קיבלת אחרי השעה 17:00, הספירה של היום הראשון תתחיל ממחר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                value={resetDate}
                onChange={(e) => setResetDate(e.target.value)}
                className="border border-rose-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-rose-500 flex-grow bg-white"
              />
              <input
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="border border-rose-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-rose-500 bg-white w-full sm:w-32"
              />
              <button
                onClick={handleConfirmReset}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>התחילי מעקב עכשיו ✨</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Condition 2: Active Cycle Dashboard */
        <div className="space-y-6">

          {/* Hero Stage Banner */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 -ml-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  שלום אהבה שלי ❤️
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  אנחנו היום ביום {cycleMetrics.cycleDay} למחזור
                </h2>
                <p className="mt-2 text-rose-100 text-sm max-w-xl leading-relaxed">
                  תאריך התחלה: {formatDateIsraeli(cycleStartDate)} ({formatDayName(cycleStartDate)}).
                  {cycleMetrics.currentStage ? (
                    <> שלב נוכחי: <strong className="text-white underline">{cycleMetrics.currentStage.title}</strong></>
                  ) : (
                    <> מעקב בתהליך לפי הפרוטוקול שנקבע.</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setResetDate(toISODate(new Date()));
                    setResetTime('10:00');
                    setIsResetModalOpen(true);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-3.5 py-2 rounded-xl transition backdrop-blur-xs font-medium cursor-pointer"
                >
                  איפוס למחזור חדש
                </button>
                <button
                  onClick={() => setHasCycle(false)}
                  className="bg-black/20 hover:bg-black/30 text-rose-100 text-xs px-3.5 py-2 rounded-xl transition font-medium"
                >
                  סיום מעקב נוכחי
                </button>
              </div>
            </div>
          </div>

          {/* Grid: What to do today + Key milestones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: Today's Tasks & Meds Checklist */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌸</span>
                  <h3 className="font-bold text-slate-800 text-lg">משימות ותרופות להיום</h3>
                </div>
                <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full">
                  {formatDateIsraeli(new Date())}
                </span>
              </div>

              <div className="space-y-3">
                {/* Active Stage info */}
                {cycleMetrics.currentStage && (
                  <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-100 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">📌</span>
                    <div>
                      <div className="font-bold text-sm text-pink-900">
                        {cycleMetrics.currentStage.title}
                      </div>
                      <p className="text-xs text-pink-700 mt-0.5">
                        {cycleMetrics.currentStage.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Medications to take today */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">תרופות שרלוונטיות להיום</h4>

                  {medications.map(med => {
                    // Check if med belongs to current stage or is continuous
                    const isRelevant = med.isContinuous || (cycleMetrics.currentStage && cycleMetrics.currentStage.medicationId === med.id);
                    if (!isRelevant) return null;

                    const takenToday = isTaskCompletedOnDate(completedItems, med.id, todayYmdIsrael);

                    return (
                      <div
                        key={med.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`check-${med.id}`}
                            checked={takenToday}
                            onChange={(e) => {
                              const next = { ...completedItems };
                              if (e.target.checked) {
                                next[med.id] = todayYmdIsrael;
                                showToast(`כל הכבוד יעלי! לקחת ${med.name} ❤️`);
                              } else {
                                delete next[med.id];
                              }
                              setCompletedItems(next);
                            }}
                            className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <div>
                            <label
                              htmlFor={`check-${med.id}`}
                              className={`text-sm font-bold cursor-pointer ${takenToday ? 'line-through text-slate-400' : 'text-slate-800'}`}
                            >
                              {med.name}
                            </label>
                            <p className="text-xs text-slate-500">
                              מינון: {med.dosage} | שעות: {med.hours.join(', ')}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => sendTelegramReminder(med, med.hours[0])}
                          disabled={sendingMedId === med.id}
                          className="inline-flex items-center gap-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 cursor-pointer transition disabled:opacity-50"
                          title="שלח תזכורת בטלגרם ליעלי"
                        >
                          <span>✈️</span>
                          <span className="hidden sm:inline">
                            {sendingMedId === med.id ? 'שולח...' : 'תזכורת בטלגרם'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Love note from partner */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-3">
                  <span className="text-xl">💌</span>
                  <div>
                    <strong>תזכורת אישית מאהובך:</strong> לשתות הרבה מים היום, לנוח מתי שצריך, ואם משהו מרגיש לא נוח - פשוט תגידי לי. אני כאן לכל דבר!
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Protocol Roadmap Overview */}
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
                  <span className="text-xl">🎯</span>
                  <h3 className="font-bold text-slate-800 text-lg">שלבי הטיפול הקרובים</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {resolvedStages.slice(0, 5).map((stg, i) => {
                    const colors = getColorClasses(stg.color);
                    return (
                      <div
                        key={stg.id}
                        className={`p-3 rounded-xl border text-xs transition ${stg.isCurrent
                          ? 'border-rose-400 bg-rose-50/60 font-semibold shadow-2xs'
                          : stg.isCompleted
                            ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-80'
                            : 'border-slate-100 bg-white text-slate-700'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{stg.title}</span>
                          {stg.isCurrent && (
                            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                              עכשיו
                            </span>
                          )}
                          {stg.isCompleted && (
                            <span className="text-emerald-600 font-bold">✓ הושלם</span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          יום {stg.relativeStartDay} ({formatDateIsraeli(stg.startDate)})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl transition"
              >
                צפה בציר הזמן המלא ועריכת שלבים ←
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
