"use client";

import type React from 'react';
import { getColorClasses } from '@/lib/tracker/colors';
import { formatDateIsraeli, formatDayName } from '@/lib/tracker/dates';
import type { ResolvedStage, Stage } from '@/lib/tracker/types';

type TimelineTabProps = {
  cycleStartDate: string;
  stages: Stage[];
  setEditingStage: React.Dispatch<React.SetStateAction<Stage | null>>;
  setIsStageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resolvedStages: ResolvedStage[];
  moveStage: (index: number, direction: number) => void;
};

export default function TimelineTab({ cycleStartDate, stages, setEditingStage, setIsStageModalOpen, resolvedStages, moveStage }: TimelineTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>⏳</span>
              <span>ציר הזמן של הפרוטוקול</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              כל שלב מחושב ישירות מתאריך קבלת המחזור ({formatDateIsraeli(cycleStartDate)}). ניתן להזיז, לערוך ולשנות ימים בחופשיות.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingStage({
                  id: '',
                  title: '',
                  relativeStartDay: 10,
                  durationDays: 1,
                  type: 'checkup',
                  description: '',
                  medicationId: '',
                  color: 'blue'
                });
                setIsStageModalOpen(true);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>הוסף שלב מותאם אישית</span>
            </button>
          </div>
        </div>

        {/* Timeline Flow */}
        <div className="mt-8 relative">
          {/* Vertical Line */}
          <div className="absolute right-6 top-4 bottom-4 w-1 bg-gradient-to-b from-rose-400 via-pink-300 to-emerald-400 rounded-full hidden sm:block"></div>

          <div className="space-y-5">
            {resolvedStages.map((stg, index) => {
              const colors = getColorClasses(stg.color);
              return (
                <div
                  key={stg.id}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${stg.isCurrent
                    ? 'bg-rose-50/60 border-rose-400 shadow-md ring-2 ring-rose-200'
                    : stg.isCompleted
                      ? 'bg-slate-50/70 border-slate-200 opacity-90'
                      : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs'
                    }`}
                >
                  {/* Number / Status Icon */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-xs ${stg.isCurrent
                        ? 'bg-rose-500 text-white'
                        : stg.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      <span className="text-[10px] uppercase">יום</span>
                      <span className="text-base leading-none">{stg.relativeStartDay}</span>
                    </div>

                    <div className="sm:hidden font-bold text-slate-800">
                      {stg.title}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 hidden sm:block">
                        {stg.title}
                      </h3>

                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                        {stg.durationDays > 1 ? `${stg.durationDays} ימים` : 'יום בודד'}
                      </span>

                      {stg.isCurrent && (
                        <span className="text-[11px] bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                          שלב פעיל כרגע ⭐
                        </span>
                      )}

                      {stg.isCompleted && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                          ✓ בוצע
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      {stg.description}
                    </p>

                    <div className="text-xs text-rose-600 font-medium flex items-center gap-2 pt-1">
                      <span>📅 {formatDateIsraeli(stg.startDate)} ({formatDayName(stg.startDate)})</span>
                      {stg.durationDays > 1 && (
                        <span>עד {formatDateIsraeli(stg.endDate)}</span>
                      )}
                      {stg.linkedMed && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          משויך לתרופה: {stg.linkedMed.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls (Move Up/Down, Edit) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => moveStage(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="הזז למעלה"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveStage(index, 1)}
                      disabled={index === stages.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="הזז למטה"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => {
                        setEditingStage(stg);
                        setIsStageModalOpen(true);
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      ערוך ✏️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
