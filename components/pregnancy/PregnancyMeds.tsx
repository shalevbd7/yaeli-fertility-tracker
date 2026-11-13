"use client";

import { useState } from 'react';
import { MEDICATION_DISCLAIMER } from '@/lib/content/pregnancy';
import { normalizeTimes, scheduleOf } from '@/lib/pregnancy/doses';
import { WEEKDAY_SHORT_HE, newId } from '@/lib/pregnancy/view';
import { getColorClasses } from '@/lib/tracker/colors';
import type { AsNeededLogEntry, Medication } from '@/lib/tracker/types';
import DoseChecklist from './DoseChecklist';

type PregnancyMedsProps = {
  medications: Medication[];
  doseLog: Record<string, string>;
  asNeededLog: AsNeededLogEntry[];
  todayYmd: string;
  weekday: number;
  onSaveMed: (med: Medication) => void;
  onDeleteMed: (id: string) => void;
  onToggleDose: (med: Medication, time: string, taken: boolean) => void;
  onTakeAsNeeded: (med: Medication) => void;
  sendTelegramReminder: (med: Medication, customTime?: string) => void;
  sendingMedId: string | null;
};

const COLORS = ['rose', 'pink', 'amber', 'blue', 'purple', 'emerald'];

function scheduleText(med: Medication): string {
  const s = scheduleOf(med);
  if (s === 'asNeeded') return 'לפי הצורך';
  const times = normalizeTimes(med.hours ?? []).join(', ');
  if (s === 'weekly') {
    const days = (med.weekdays ?? []).map((d) => WEEKDAY_SHORT_HE[d]).join(' ');
    return `שבועי (${days || 'לא נבחרו ימים'}) · ${times}`;
  }
  return `כל יום · ${times}`;
}

export default function PregnancyMeds({
  medications,
  doseLog,
  asNeededLog,
  todayYmd,
  weekday,
  onSaveMed,
  onDeleteMed,
  onToggleDose,
  onTakeAsNeeded,
  sendTelegramReminder,
  sendingMedId,
}: PregnancyMedsProps) {
  const [editing, setEditing] = useState<Medication | null>(null);
  const isNew = editing ? !medications.some((m) => m.id === editing.id) : false;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>💊</span>
              <span>תרופות וויטמינים</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">{MEDICATION_DISCLAIMER}</p>
          </div>
          <button
            onClick={() =>
              setEditing({
                id: newId('pmed'),
                name: '',
                dosage: '',
                timesPerDay: 1,
                hours: ['08:00'],
                durationDays: 0,
                isContinuous: true,
                notes: '',
                color: 'rose',
                schedule: 'daily',
                weekdays: [],
              })
            }
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>הוספת תרופה / ויטמין</span>
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">היום – כל מנה בנפרד</h3>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => {
            const colors = getColorClasses(med.color);
            return (
              <div key={med.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-rose-300 transition-all shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{med.name}</h3>
                    {med.dosage && <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${colors.badge}`}>{med.dosage}</span>}
                  </div>
                  <button onClick={() => setEditing(med)} className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" title="עריכה">
                    ✏️
                  </button>
                </div>
                <p className="text-xs text-slate-600">⏰ {scheduleText(med)}</p>
                {med.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{med.notes}</p>}
              </div>
            );
          })}
        </div>
        {medications.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">עדיין לא הוספת תרופות או ויטמינים.</p>
        )}
        <p className="text-[11px] text-slate-400">
          תזכורות אוטומטיות בטלגרם נשלחות בשעות שהוגדרו לכל מנה שעדיין לא סומנה – כמו בתרופות הפוריות. לתרופות &quot;לפי הצורך&quot; אין תזכורות.
        </p>
      </div>

      {editing && (
        <PregnancyMedModal
          med={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            onSaveMed(m);
            setEditing(null);
          }}
          onDelete={() => {
            onDeleteMed(editing.id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PregnancyMedModal({
  med,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  med: Medication;
  isNew: boolean;
  onClose: () => void;
  onSave: (m: Medication) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Medication>({ ...med, schedule: scheduleOf(med), weekdays: med.weekdays ?? [] });
  const schedule = draft.schedule ?? 'daily';
  const times = draft.hours.length ? draft.hours : [''];
  const validTimes = normalizeTimes(draft.hours);
  const valid =
    draft.name.trim().length > 0 &&
    (schedule === 'asNeeded' || validTimes.length > 0) &&
    (schedule !== 'weekly' || (draft.weekdays?.length ?? 0) > 0);

  const setTime = (i: number, value: string) => {
    const next = [...times];
    next[i] = value;
    setDraft({ ...draft, hours: next });
  };

  const save = () => {
    const hours = validTimes;
    onSave({
      ...draft,
      name: draft.name.trim(),
      dosage: draft.dosage.trim(),
      hours,
      timesPerDay: hours.length,
      durationDays: 0,
      isContinuous: true,
      weekdays: schedule === 'weekly' ? [...(draft.weekdays ?? [])].sort() : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">{isNew ? 'הוספת תרופה / ויטמין' : 'עריכת תרופה / ויטמין'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">שם:</label>
            <input
              type="text"
              value={draft.name}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="השם כפי שרשם/ה הרופא/ה"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">מינון (כפי שנרשם לך):</label>
            <input
              type="text"
              value={draft.dosage}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, dosage: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="לפי המרשם"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">תדירות:</label>
            <div className="grid grid-cols-3 gap-2">
              {([['daily', 'כל יום'], ['weekly', 'ימים קבועים בשבוע'], ['asNeeded', 'לפי הצורך']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDraft({ ...draft, schedule: id })}
                  className={`py-2 px-1 rounded-xl border font-semibold transition cursor-pointer ${schedule === id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {schedule === 'weekly' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">באילו ימים:</label>
              <div className="flex gap-1.5">
                {WEEKDAY_SHORT_HE.map((label, d) => {
                  const on = draft.weekdays?.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          weekdays: on ? (draft.weekdays ?? []).filter((x) => x !== d) : [...(draft.weekdays ?? []), d],
                        })
                      }
                      className={`w-9 h-9 rounded-full border font-bold cursor-pointer ${on ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {schedule !== 'asNeeded' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">שעות (כל שעה היא מנה נפרדת):</label>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => setTime(i, e.target.value)}
                      className="border border-slate-300 rounded-xl p-2 text-sm"
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, hours: times.filter((_, j) => j !== i) })}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="הסרת שעה"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, hours: [...times, ''] })}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  + הוספת שעה
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">הערות:</label>
            <textarea
              value={draft.notes}
              rows={2}
              maxLength={1000}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="עם אוכל, הנחיות הרופא/ה וכו׳"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">צבע:</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`w-7 h-7 rounded-full border-2 cursor-pointer ${getColorClasses(c).badge} ${draft.color === c ? 'border-slate-700' : 'border-transparent'}`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {!isNew && (
            <button type="button" onClick={onDelete} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">
              מחיקה
            </button>
          )}
          <div className="flex gap-2 mr-auto">
            <button type="button" onClick={onClose} className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
              ביטול
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={save}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              שמירה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
