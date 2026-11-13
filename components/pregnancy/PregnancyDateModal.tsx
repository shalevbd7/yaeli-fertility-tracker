"use client";

import { useMemo, useState } from 'react';
import { ymdInIsrael } from '@/lib/israel-date';
import {
  formatGestationalAge,
  lmpFromGestationalAge,
  pregnancyStatus,
  validateGestationalAge,
  validateLmp,
} from '@/lib/pregnancy/dates';
import { formatYmd } from '@/lib/pregnancy/view';

type PregnancyDateModalProps = {
  title: string;
  confirmLabel: string;
  initialLmp?: string;
  onConfirm: (lmpDate: string) => Promise<void> | void;
  onClose: () => void;
};

const ERROR_TEXT: Record<string, string> = {
  invalid: 'נא להזין שבוע בין 0 ל-42 וימים בין 0 ל-6.',
  future: 'התאריך לא יכול להיות בעתיד.',
  'too-old': 'התאריך רחוק מדי – נא לבדוק אותו.',
};

/** Enter either "I'm in week X + Y days" or the LMP date; shows what will be stored. */
export default function PregnancyDateModal({ title, confirmLabel, initialLmp, onConfirm, onClose }: PregnancyDateModalProps) {
  const today = ymdInIsrael();
  const [method, setMethod] = useState<'week' | 'lmp'>(initialLmp ? 'lmp' : 'week');
  const [weeks, setWeeks] = useState('');
  const [days, setDays] = useState('0');
  const [lmp, setLmp] = useState(initialLmp ?? '');
  const [busy, setBusy] = useState(false);

  const result = useMemo(() => {
    if (method === 'week') {
      if (weeks === '') return { error: null, lmp: null };
      const w = Number(weeks);
      const d = Number(days || '0');
      const err = validateGestationalAge(w, d);
      if (err) return { error: ERROR_TEXT[err], lmp: null };
      return { error: null, lmp: lmpFromGestationalAge(today, w, d) };
    }
    if (!lmp) return { error: null, lmp: null };
    const err = validateLmp(lmp, today);
    if (err) return { error: ERROR_TEXT[err] ?? ERROR_TEXT.invalid, lmp: null };
    return { error: null, lmp };
  }, [method, weeks, days, lmp, today]);

  const preview = result.lmp ? pregnancyStatus(result.lmp, today) : null;

  const confirm = async () => {
    if (!result.lmp) return;
    setBusy(true);
    try {
      await onConfirm(result.lmp);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">
        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-rose-50 p-1 rounded-xl text-sm font-semibold">
          {([['week', 'אני בשבוע…'], ['lmp', 'תאריך וסת אחרונה']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={`py-2 rounded-lg transition cursor-pointer ${method === id ? 'bg-white text-rose-700 shadow-xs' : 'text-rose-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {method === 'week' ? (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">שבוע (שבועות שלמים)</label>
              <input
                type="number"
                min="0"
                max="42"
                inputMode="numeric"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                placeholder="לדוגמה: 12"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">ועוד ימים (0–6)</label>
              <input
                type="number"
                min="0"
                max="6"
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">היום הראשון של הווסת האחרונה</label>
            <input
              type="date"
              max={today}
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
            />
          </div>
        )}

        {result.error && <p className="text-xs text-rose-600">{result.error}</p>}

        {preview && result.lmp && (
          <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-sm space-y-1 text-rose-900">
            <div>היום: <strong>{formatGestationalAge(preview.weeks, preview.days)}</strong> (שליש {preview.trimester})</div>
            <div>וסת אחרונה: <strong>{formatYmd(result.lmp)}</strong></div>
            <div>תאריך לידה משוער: <strong>{formatYmd(preview.dueDate)}</strong></div>
          </div>
        )}

        <p className="text-[11px] text-slate-500">
          השבועות נספרים מהיום הראשון של הווסת האחרונה, ותאריך הלידה המשוער הוא 280 יום אחריו. אם הרופא/ה קבע/ה תאריך אחר לפי אולטרסאונד – אפשר לעדכן אותו בכל עת בהגדרות.
        </p>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
            ביטול
          </button>
          <button
            type="button"
            disabled={!result.lmp || busy}
            onClick={confirm}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
          >
            {busy ? 'שומרים...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
