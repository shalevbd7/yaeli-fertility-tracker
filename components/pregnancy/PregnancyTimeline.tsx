"use client";

import { useEffect, useRef, useState } from 'react';
import { COUNTING_NOTE, EARLY_WEEKS_NOTE, STANDARD_TESTS, TRIMESTERS, WEEKS } from '@/lib/content/pregnancy';
import { addDaysYmd } from '@/lib/israel-date';
import { formatGestationalAge, type PregnancyStatus } from '@/lib/pregnancy/dates';
import { formatYmd } from '@/lib/pregnancy/view';
import MedicalDisclaimer from './MedicalDisclaimer';

type PregnancyTimelineProps = {
  status: PregnancyStatus;
  lmpDate: string;
};

/** Pregnancy timeline by trimester and week, with the current position highlighted. */
export default function PregnancyTimeline({ status, lmpDate }: PregnancyTimelineProps) {
  const [open, setOpen] = useState<number>(status.trimester);
  const currentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [open]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-6">
        <div className="border-b border-rose-100 pb-5">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🤰</span>
            <span>ציר ההריון</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            את כרגע ב<strong className="text-rose-600">{formatGestationalAge(status.weeks, status.days)}</strong>. {COUNTING_NOTE}
          </p>
        </div>

        {/* Trimester progress strip */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {TRIMESTERS.map((t) => {
            const isCurrent = t.trimester === status.trimester;
            const isDone = status.trimester > t.trimester;
            return (
              <button
                key={t.trimester}
                type="button"
                onClick={() => setOpen(t.trimester)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200'
                } ${open === t.trimester && !isCurrent ? 'ring-2 ring-rose-200' : ''}`}
              >
                <div className="font-bold">{t.title}</div>
                <div className="opacity-80">{t.weeksLabel}</div>
                {isDone && <div className="mt-1 font-semibold">✓ הושלם</div>}
              </button>
            );
          })}
        </div>

        {TRIMESTERS.filter((t) => t.trimester === open).map((t) => (
          <div key={t.trimester} className="space-y-4">
            <p className="text-sm text-slate-700 bg-rose-50/60 border border-rose-100 rounded-2xl p-4 leading-relaxed">{t.summary}</p>

            <div className="relative">
              <div className="absolute right-6 top-4 bottom-4 w-1 bg-gradient-to-b from-rose-400 via-pink-300 to-emerald-400 rounded-full hidden sm:block"></div>
              <div className="space-y-4">
                {t.trimester === 1 && (
                  <div className="relative flex gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 font-bold flex flex-col items-center justify-center text-xs shrink-0">
                      <span className="text-[10px]">שבוע</span>
                      <span className="text-sm leading-none">0–3</span>
                    </div>
                    <p className="text-xs text-slate-600 self-center">{EARLY_WEEKS_NOTE.baby} {EARLY_WEEKS_NOTE.you}</p>
                  </div>
                )}
                {WEEKS.filter((w) => w.week >= t.fromWeek && w.week <= t.toWeek).map((w) => {
                  const isCurrent = w.week === status.weeks;
                  const isPast = w.week < status.weeks;
                  const testsStarting = STANDARD_TESTS.filter((test) => test.fromWeek === w.week && test.kind !== 'optional');
                  return (
                    <div
                      key={w.week}
                      ref={isCurrent ? currentRef : undefined}
                      className={`relative flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-rose-50/60 border-rose-400 shadow-md ring-2 ring-rose-200'
                          : isPast
                            ? 'bg-slate-50/70 border-slate-200 opacity-90'
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-xs ${
                          isCurrent ? 'bg-rose-500 text-white' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px]">שבוע</span>
                        <span className="text-base leading-none">{w.week}</span>
                      </div>
                      <div className="flex-grow space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-rose-600 font-medium">📅 {formatYmd(addDaysYmd(lmpDate, w.week * 7))}</span>
                          {w.size && <span className="text-[11px] bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">{w.size}</span>}
                          {isCurrent && (
                            <span className="text-[11px] bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold">את כאן ⭐</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700"><strong>התינוק:</strong> {w.baby}</p>
                        <p className="text-sm text-slate-600"><strong>את:</strong> {w.you}</p>
                        {w.note && <p className="text-xs text-pink-900 bg-pink-50/70 border border-pink-100 rounded-lg p-2">📌 {w.note}</p>}
                        {testsStarting.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {testsStarting.map((test) => (
                              <span key={test.key} className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                                🩺 {test.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
