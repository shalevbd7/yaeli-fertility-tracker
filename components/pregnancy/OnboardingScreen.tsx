"use client";

import { useState } from 'react';
import PregnancyDateModal from './PregnancyDateModal';

type OnboardingScreenProps = {
  onChoose: (choice: 'fertility' | 'pregnancy', lmpDate?: string) => Promise<void>;
};

/** First run for a brand-new, completely empty account only. */
export default function OnboardingScreen({ onChoose }: OnboardingScreenProps) {
  const [busy, setBusy] = useState(false);
  const [askDate, setAskDate] = useState(false);

  const choose = async (choice: 'fertility' | 'pregnancy', lmpDate?: string) => {
    setBusy(true);
    try {
      await onChoose(choice, lmpDate);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">🌸</div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">ברוכה הבאה למסע שלנו ❤️</h2>
        <p className="text-slate-600 mt-2 leading-relaxed">ספרי לנו איפה את נמצאת עכשיו, ונתאים לך את האפליקציה.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => choose('fertility')}
          className="p-6 rounded-2xl border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 transition text-right space-y-2 cursor-pointer disabled:opacity-50"
        >
          <div className="text-3xl">💊</div>
          <div className="font-bold text-slate-900">אני בטיפולי פוריות</div>
          <div className="text-xs text-slate-500">ציר זמן לפי המחזור, ארון תרופות ותזכורות.</div>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setAskDate(true)}
          className="p-6 rounded-2xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition text-right space-y-2 cursor-pointer disabled:opacity-50"
        >
          <div className="text-3xl">🤰</div>
          <div className="font-bold text-slate-900">אני בהריון</div>
          <div className="text-xs text-slate-500">שבוע ההריון, בדיקות, תסמינים ותרופות וויטמינים.</div>
        </button>
      </div>

      {askDate && (
        <PregnancyDateModal
          title="מזל טוב! באיזה שלב את? 🤰"
          confirmLabel="התחילי מעקב הריון"
          onClose={() => setAskDate(false)}
          onConfirm={(lmp) => choose('pregnancy', lmp)}
        />
      )}
    </div>
  );
}
