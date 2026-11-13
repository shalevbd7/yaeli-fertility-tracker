"use client";

import type React from 'react';
import { LOVING_AFFIRMATIONS } from '@/lib/tracker/defaults';

type AffirmationBannerProps = {
  quoteIndex: number;
  setQuoteIndex: React.Dispatch<React.SetStateAction<number>>;
};

export default function AffirmationBanner({ quoteIndex, setQuoteIndex }: AffirmationBannerProps) {
  return (
    <div className="bg-gradient-to-r from-rose-100/80 via-pink-50 to-amber-50 border border-rose-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-bounce">💖</span>
        <div>
          <p className="text-sm font-semibold text-rose-900">
            {LOVING_AFFIRMATIONS[quoteIndex]}
          </p>
          <p className="text-xs text-rose-500 mt-0.5">את אף פעם לא לבד בתהליך הזה</p>
        </div>
      </div>
      <button
        onClick={() => setQuoteIndex((quoteIndex + 1) % LOVING_AFFIRMATIONS.length)}
        className="text-xs bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium cursor-pointer transition shrink-0"
        title="משפט חיזוק חדש"
      >
        חיבוק נוסף ✨
      </button>
    </div>
  );
}
