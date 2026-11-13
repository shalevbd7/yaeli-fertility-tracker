"use client";

import { CREDITED_SOURCES, MEDICAL_DISCLAIMER } from '@/lib/content/pregnancy';

/** Visible "general information, not medical advice" note for pregnancy content. */
export default function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-sky-50/70 border border-sky-200 text-sky-900 rounded-2xl p-4 text-xs leading-relaxed flex gap-3" role="note">
      <span className="text-lg shrink-0">ℹ️</span>
      <div>
        <strong>מידע כללי בלבד – לא ייעוץ רפואי.</strong> {MEDICAL_DISCLAIMER}
        {!compact && (
          <div className="mt-1 text-sky-700">מבוסס על: {CREDITED_SOURCES.join(' · ')}</div>
        )}
      </div>
    </div>
  );
}
