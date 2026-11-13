"use client";

import { useState } from 'react';
import { SYMPTOMS, TRIMESTERS, WARNING_INTRO, WARNING_SIGNS, WHERE_TO_TURN } from '@/lib/content/pregnancy';
import type { Trimester } from '@/lib/pregnancy/dates';
import { formatYmd, newId } from '@/lib/pregnancy/view';
import type { SymptomLogEntry } from '@/lib/tracker/types';
import MedicalDisclaimer from './MedicalDisclaimer';

type PregnancySymptomsProps = {
  currentTrimester: Trimester;
  todayYmd: string;
  symptomLog: SymptomLogEntry[];
  onAddLog: (entry: SymptomLogEntry) => void;
  onDeleteLog: (id: string) => void;
};

const nameFor = (key: string) => SYMPTOMS.find((s) => s.key === key)?.name ?? 'אחר';

export default function PregnancySymptoms({ currentTrimester, todayYmd, symptomLog, onAddLog, onDeleteLog }: PregnancySymptomsProps) {
  const [trimester, setTrimester] = useState<Trimester | 'all'>(currentTrimester);
  const [open, setOpen] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(todayYmd);
  const [logNote, setLogNote] = useState('');

  const list = trimester === 'all' ? SYMPTOMS : SYMPTOMS.filter((s) => s.trimesters.includes(trimester));
  const recentLog = [...symptomLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  const startLog = (key: string) => {
    setLogFor(key);
    setLogDate(todayYmd);
    setLogNote('');
  };

  return (
    <div className="space-y-6">
      {/* Warning signs first: the most important information on this screen */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 space-y-3">
        <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2">
          <span>🚨</span>
          <span>מתי לפנות מיד</span>
        </h2>
        <p className="text-sm text-rose-800">{WARNING_INTRO}</p>
        <ul className="space-y-1.5 text-sm text-rose-900">
          {WARNING_SIGNS.filter((w) => w.urgency === 'now').map((w) => (
            <li key={w.text} className="flex gap-2"><span>•</span><span>{w.text}</span></li>
          ))}
        </ul>
        <p className="text-sm font-semibold text-rose-900 pt-1">לפנות לרופא/ה באותו יום:</p>
        <ul className="space-y-1.5 text-sm text-rose-800">
          {WARNING_SIGNS.filter((w) => w.urgency === 'soon').map((w) => (
            <li key={w.text} className="flex gap-2"><span>•</span><span>{w.text}</span></li>
          ))}
        </ul>
        <p className="text-xs text-rose-700 bg-white/60 rounded-xl p-3">📞 {WHERE_TO_TURN}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-5">
        <div className="border-b border-rose-100 pb-5">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🌿</span>
            <span>תסמינים נפוצים</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">הסברים קצרים, טיפים להקלה, ומתי כדאי לפנות. אפשר גם לרשום מה את מרגישה.</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {TRIMESTERS.map((t) => (
            <button
              key={t.trimester}
              onClick={() => setTrimester(t.trimester)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${trimester === t.trimester ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50'}`}
            >
              {t.title}
              {t.trimester === currentTrimester && ' (עכשיו)'}
            </button>
          ))}
          <button
            onClick={() => setTrimester('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${trimester === 'all' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50'}`}
          >
            הכול
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((s) => {
            const isOpen = open === s.key;
            return (
              <div key={s.key} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{s.icon} {s.name}</h3>
                  <button
                    onClick={() => startLog(s.key)}
                    className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
                  >
                    + יש לי את זה
                  </button>
                </div>
                {s.timing && <p className="text-xs text-rose-600">⏱ {s.timing}</p>}
                <p className="text-xs text-slate-700 leading-relaxed">{s.summary}</p>
                {isOpen && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-800">מה יכול לעזור:</p>
                      <ul className="text-xs text-slate-600 list-disc pr-4 space-y-0.5">
                        {s.tips.map((tip) => <li key={tip}>{tip}</li>)}
                      </ul>
                    </div>
                    <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5">
                      <strong>מתי לפנות לרופא/ה:</strong> {s.whenToCall}
                    </p>
                  </div>
                )}
                <button onClick={() => setOpen(isOpen ? null : s.key)} className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer">
                  {isOpen ? 'הסתרה ▲' : 'טיפים ומתי לפנות ▼'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><span>📓</span><span>היומן שלי</span></h3>
          <button onClick={() => startLog('other')} className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer">+ רישום אחר</button>
        </div>
        {recentLog.length === 0 ? (
          <p className="text-xs text-slate-500">עדיין לא נרשמו תסמינים. כדאי לרשום – זה עוזר לספר לרופא/ה מה עבר עלייך.</p>
        ) : (
          <div className="space-y-2">
            {recentLog.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="font-bold text-slate-800">{nameFor(e.symptomKey)}</span>
                  <span className="text-slate-400"> · {formatYmd(e.date)}</span>
                  {e.note && <p className="text-slate-600 mt-0.5">{e.note}</p>}
                </div>
                <button onClick={() => onDeleteLog(e.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer" title="מחיקה">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <MedicalDisclaimer />

      {logFor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4 text-right">
            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">רישום: {nameFor(logFor)}</h3>
              <button onClick={() => setLogFor(null)} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">✕</button>
            </div>
            <div className="text-xs space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">תאריך:</label>
                <input type="date" max={todayYmd} value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">הערה (לא חובה):</label>
                <textarea rows={2} maxLength={1000} value={logNote} onChange={(e) => setLogNote(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" placeholder="עוצמה, מתי, מה עזר" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setLogFor(null)} className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">ביטול</button>
              <button
                disabled={!logDate}
                onClick={() => {
                  onAddLog({ id: newId('sl'), symptomKey: logFor, date: logDate, note: logNote.trim() });
                  setLogFor(null);
                }}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                שמירה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
