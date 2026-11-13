"use client";

import type React from 'react';
import { SYMPTOMS, TRIMESTERS, weekInfoFor } from '@/lib/content/pregnancy';
import { formatGestationalAge, type PregnancyStatus } from '@/lib/pregnancy/dates';
import { formatYmd, type TestRow } from '@/lib/pregnancy/view';
import type { AsNeededLogEntry, Medication, TabId } from '@/lib/tracker/types';
import DoseChecklist from './DoseChecklist';
import MedicalDisclaimer from './MedicalDisclaimer';

type PregnancyDashboardProps = {
  status: PregnancyStatus;
  lmpDate: string;
  todayYmd: string;
  weekday: number;
  medications: Medication[];
  doseLog: Record<string, string>;
  asNeededLog: AsNeededLogEntry[];
  upcoming: TestRow[];
  onToggleDose: (med: Medication, time: string, taken: boolean) => void;
  onTakeAsNeeded: (med: Medication) => void;
  sendTelegramReminder: (med: Medication, customTime?: string) => void;
  sendingMedId: string | null;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'נקבע תור',
  'due-now': 'זה הזמן',
  upcoming: 'בקרוב',
};

export default function PregnancyDashboard({
  status,
  lmpDate,
  todayYmd,
  weekday,
  medications,
  doseLog,
  asNeededLog,
  upcoming,
  onToggleDose,
  onTakeAsNeeded,
  sendTelegramReminder,
  sendingMedId,
  setActiveTab,
}: PregnancyDashboardProps) {
  const week = weekInfoFor(status.weeks);
  const trimester = TRIMESTERS.find((t) => t.trimester === status.trimester)!;
  const symptomsNow = SYMPTOMS.filter((s) => s.trimesters.includes(status.trimester)).slice(0, 4);
  const percent = Math.round(status.progress * 100);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 -ml-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold">
            {trimester.title} · {trimester.weeksLabel}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatGestationalAge(status.weeks, status.days)} 🤰
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white/15 rounded-2xl p-3">
              <div className="text-rose-100 text-xs">תאריך לידה משוער</div>
              <div className="font-bold">{formatYmd(status.dueDate)}</div>
            </div>
            <div className="bg-white/15 rounded-2xl p-3">
              <div className="text-rose-100 text-xs">{status.isPastDue ? 'עברו מהתאריך' : 'נותרו עד התאריך'}</div>
              <div className="font-bold">{Math.abs(status.daysToDue)} ימים</div>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 col-span-2 sm:col-span-1">
              <div className="text-rose-100 text-xs">וסת אחרונה</div>
              <div className="font-bold">{formatYmd(lmpDate)}</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-rose-100 mb-1">
              <span>התקדמות ההריון</span>
              <span>{percent}%</span>
            </div>
            <div
              className="h-3 bg-white/25 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* This week + today's doses */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <span className="text-xl">🌱</span>
              <h3 className="font-bold text-slate-800 text-lg">
                {status.weeks >= 4 && status.weeks <= 41 ? `מה קורה בשבוע ${status.weeks}` : 'מה קורה עכשיו'}
              </h3>
            </div>
            {week.size && <p className="text-xs text-rose-600 font-semibold">גודל משוער: {week.size}</p>}
            <p className="text-sm text-slate-700 leading-relaxed"><strong>התינוק:</strong> {week.baby}</p>
            <p className="text-sm text-slate-700 leading-relaxed"><strong>את:</strong> {week.you}</p>
            {week.note && (
              <p className="text-xs bg-pink-50/70 border border-pink-100 text-pink-900 rounded-xl p-3">📌 {week.note}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💊</span>
                <h3 className="font-bold text-slate-800 text-lg">תרופות וויטמינים להיום</h3>
              </div>
              <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full">{formatYmd(todayYmd)}</span>
            </div>
            <DoseChecklist
              medications={medications}
              doseLog={doseLog}
              asNeededLog={asNeededLog}
              todayYmd={todayYmd}
              weekday={weekday}
              onToggleDose={onToggleDose}
              onTakeAsNeeded={onTakeAsNeeded}
              sendTelegramReminder={sendTelegramReminder}
              sendingMedId={sendingMedId}
            />
            <button
              onClick={() => setActiveTab('pg-meds')}
              className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl transition"
            >
              ניהול תרופות וויטמינים ←
            </button>
          </div>
        </div>

        {/* Upcoming tests + symptoms */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <span className="text-xl">🩺</span>
              <h3 className="font-bold text-slate-800 text-lg">בדיקות קרובות</h3>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-500">אין בדיקות קרובות ברשימה.</p>
            ) : (
              upcoming.map((row) => (
                <div key={row.key} className="p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-slate-800">{row.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.status === 'due-now' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {row.record?.date
                      ? `📅 ${formatYmd(row.record.date)}${row.record.location ? ` · ${row.record.location}` : ''}`
                      : row.windowFrom && `חלון מומלץ: ${formatYmd(row.windowFrom)} – ${formatYmd(row.windowTo)}`}
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => setActiveTab('pg-tests')}
              className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl transition"
            >
              כל הבדיקות ←
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <span className="text-xl">🌿</span>
              <h3 className="font-bold text-slate-800 text-lg">נפוץ בשלב הזה</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {symptomsNow.map((s) => (
                <span key={s.key} className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
            <button
              onClick={() => setActiveTab('pg-symptoms')}
              className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl transition"
            >
              תסמינים, טיפים ומתי לפנות ←
            </button>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
