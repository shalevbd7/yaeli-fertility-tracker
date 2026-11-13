"use client";

import type React from 'react';
import { getColorClasses } from '@/lib/tracker/colors';
import { toISODate } from '@/lib/tracker/dates';
import type { CalendarEvent } from '@/lib/tracker/types';

type CalendarTabProps = {
  calendarDate: Date;
  setCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  calendarEventsMap: Record<string, CalendarEvent[]>;
};

export default function CalendarTab({ calendarDate, setCalendarDate, calendarEventsMap }: CalendarTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">

        {/* Calendar Month Navigation Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>📅</span>
              <span>לוח שנה חודשי – מעקב זקיקים</span>
            </h2>
            <p className="text-sm text-slate-500">
              תצוגה חזותית של כל הכדורים, הזריקות ובדיקות האולטראסאונד הפרוסים על גבי החודש.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(calendarDate);
                prev.setMonth(prev.getMonth() - 1);
                setCalendarDate(prev);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              חודש קודם →
            </button>

            <div className="font-bold text-base text-rose-700 px-3">
              {calendarDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
            </div>

            <button
              onClick={() => {
                const next = new Date(calendarDate);
                next.setMonth(next.getMonth() + 1);
                setCalendarDate(next);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              ← חודש הבא
            </button>

            <button
              onClick={() => setCalendarDate(new Date())}
              className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold px-3 py-2 rounded-xl"
            >
              היום
            </button>
          </div>
        </div>

        {/* Monthly Grid */}
        <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 bg-rose-50/70 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
            <div>ראשון</div>
            <div>שני</div>
            <div>שלישי</div>
            <div>רביעי</div>
            <div>חמישי</div>
            <div>שישי</div>
            <div>שבת</div>
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();

              // First day of month
              const firstDayIndex = new Date(year, month, 1).getDay();
              const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

              const cells = [];
              // Leading empty cells
              for (let i = 0; i < firstDayIndex; i++) {
                cells.push(
                  <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/40 p-2 text-slate-300"></div>
                );
              }

              // Month days
              const todayStr = toISODate(new Date());

              for (let day = 1; day <= totalDaysInMonth; day++) {
                const cellDate = new Date(year, month, day);
                const iso = toISODate(cellDate);
                const isToday = iso === todayStr;
                const events = calendarEventsMap[iso] || [];

                cells.push(
                  <div
                    key={`day-${day}`}
                    className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition flex flex-col justify-between ${isToday ? 'bg-rose-50/80 ring-2 ring-rose-400 inset-0' : 'bg-white hover:bg-slate-50/60'
                      }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isToday ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-700'
                          }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-rose-600">היום</span>
                      )}
                    </div>

                    {/* Events Pills inside day */}
                    <div className="space-y-1 overflow-y-auto max-h-[65px] no-scrollbar">
                      {events.map((ev, idx) => {
                        const colors = getColorClasses(ev.color);
                        return (
                          <div
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold truncate border ${colors.bg} ${colors.text} ${colors.border}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return cells;
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
