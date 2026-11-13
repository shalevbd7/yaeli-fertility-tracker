"use client";

import { ymdInIsrael } from '@/lib/israel-date';
import { dosesForDay, isDoseTaken, scheduleOf } from '@/lib/pregnancy/doses';
import type { AsNeededLogEntry, Medication } from '@/lib/tracker/types';

type DoseChecklistProps = {
  medications: Medication[];
  doseLog: Record<string, string>;
  asNeededLog: AsNeededLogEntry[];
  todayYmd: string;
  weekday: number;
  onToggleDose: (med: Medication, time: string, taken: boolean) => void;
  onTakeAsNeeded: (med: Medication) => void;
  sendTelegramReminder?: (med: Medication, customTime?: string) => void;
  sendingMedId?: string | null;
};

/** Today's doses — one checkbox per scheduled time, so each dose is tracked separately. */
export default function DoseChecklist({
  medications,
  doseLog,
  asNeededLog,
  todayYmd,
  weekday,
  onToggleDose,
  onTakeAsNeeded,
  sendTelegramReminder,
  sendingMedId,
}: DoseChecklistProps) {
  const scheduled = medications.flatMap((med) => dosesForDay(med, weekday).map((time) => ({ med, time })));
  scheduled.sort((a, b) => a.time.localeCompare(b.time));
  const asNeeded = medications.filter((m) => scheduleOf(m) === 'asNeeded');

  if (scheduled.length === 0 && asNeeded.length === 0) {
    return <p className="text-xs text-slate-500">אין תרופות או ויטמינים להיום.</p>;
  }

  const takenTodayCount = (medId: string) =>
    asNeededLog.filter((e) => e.medId === medId && e.at && ymdInIsrael(new Date(e.at)) === todayYmd).length;

  return (
    <div className="space-y-2">
      {scheduled.map(({ med, time }) => {
        const taken = isDoseTaken(doseLog, med.id, time, todayYmd);
        const inputId = `dose-${med.id}-${time}`;
        return (
          <div key={inputId} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={inputId}
                checked={taken}
                onChange={(e) => onToggleDose(med, time, e.target.checked)}
                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div>
                <label htmlFor={inputId} className={`text-sm font-bold cursor-pointer ${taken ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {time} · {med.name}
                </label>
                {med.dosage && <p className="text-xs text-slate-500">{med.dosage}</p>}
              </div>
            </div>
            {sendTelegramReminder && (
              <button
                onClick={() => sendTelegramReminder(med, time)}
                disabled={sendingMedId === med.id}
                className="inline-flex items-center gap-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 cursor-pointer transition disabled:opacity-50"
                title="שלח תזכורת בטלגרם"
              >
                <span>✈️</span>
                <span className="hidden sm:inline">{sendingMedId === med.id ? 'שולח...' : 'תזכורת'}</span>
              </button>
            )}
          </div>
        );
      })}

      {asNeeded.map((med) => (
        <div key={`prn-${med.id}`} className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-800">{med.name} <span className="text-[11px] font-medium text-slate-500">(לפי הצורך)</span></div>
            <p className="text-xs text-slate-500">
              {med.dosage ? `${med.dosage} · ` : ''}נלקח היום: {takenTodayCount(med.id)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTakeAsNeeded(med)}
            className="text-xs bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition"
          >
            נטלתי עכשיו
          </button>
        </div>
      ))}
    </div>
  );
}
