"use client";

import { useState } from 'react';
import { dueDateFromLmp } from '@/lib/pregnancy/dates';
import { formatYmd } from '@/lib/pregnancy/view';
import { formatDateIsraeli } from '@/lib/tracker/dates';
import type { TrackerMode } from '@/lib/tracker/types';
import PregnancyDateModal from '@/components/pregnancy/PregnancyDateModal';

type PregnancySettingsProps = {
  mode: TrackerMode;
  lmpDate: string | null;
  fertilityArchivedAt: string | null;
  onStartPregnancy: (lmpDate: string) => Promise<void>;
  onUpdateLmp: (lmpDate: string) => Promise<void>;
  onRestoreFertility: () => Promise<void>;
};

/** Owner-only: switch to pregnancy mode, correct the date, or go back to fertility tracking. */
export default function PregnancySettings({
  mode,
  lmpDate,
  fertilityArchivedAt,
  onStartPregnancy,
  onUpdateLmp,
  onRestoreFertility,
}: PregnancySettingsProps) {
  const [modal, setModal] = useState<'start' | 'update' | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-4">
      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
        <span>🤰</span>
        <span>מצב הריון</span>
      </h3>

      {mode === 'fertility' ? (
        <>
          <p className="text-sm text-slate-600">
            כשתעברי למצב הריון, כל האפליקציה תותאם להריון: שבוע, בדיקות, תסמינים ותרופות. נתוני הפוריות שלך יישמרו בארכיון במלואם
            (שום דבר לא נמחק), ותזכורות הפוריות ייעצרו. אפשר לחזור אליהם בכל רגע מכאן.
          </p>
          <button
            type="button"
            onClick={() => setModal('start')}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-sm transition cursor-pointer"
          >
            אני בהריון 🤰
          </button>
        </>
      ) : (
        <>
          <div className="text-sm text-slate-700 bg-rose-50/60 border border-rose-100 rounded-2xl p-4 space-y-1">
            {lmpDate && (
              <>
                <div>וסת אחרונה: <strong>{formatYmd(lmpDate)}</strong></div>
                <div>תאריך לידה משוער: <strong>{formatYmd(dueDateFromLmp(lmpDate))}</strong></div>
              </>
            )}
            {fertilityArchivedAt && (
              <div className="text-xs text-slate-500">נתוני הפוריות בארכיון מאז {formatDateIsraeli(fertilityArchivedAt)}.</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModal('update')}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              עדכון שבוע / תאריך
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm('לחזור למעקב פוריות? נתוני ההריון יישמרו בארכיון (לא יימחקו), ונתוני הפוריות יחזרו בדיוק כפי שהיו.')) return;
                setBusy(true);
                try {
                  await onRestoreFertility();
                } finally {
                  setBusy(false);
                }
              }}
              className="text-xs text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              חזרה למעקב פוריות
            </button>
          </div>
        </>
      )}

      {modal && (
        <PregnancyDateModal
          title={modal === 'start' ? 'מזל טוב! באיזה שלב את? 🤰' : 'עדכון שבוע ההריון'}
          confirmLabel={modal === 'start' ? 'מעבר למצב הריון' : 'עדכון'}
          initialLmp={modal === 'update' ? lmpDate ?? undefined : undefined}
          onClose={() => setModal(null)}
          onConfirm={async (lmp) => {
            if (modal === 'start') await onStartPregnancy(lmp);
            else await onUpdateLmp(lmp);
            setModal(null);
          }}
        />
      )}
    </section>
  );
}
