"use client";

import type React from 'react';
import type { Medication, Stage } from '@/lib/tracker/types';

type StageModalProps = {
  medications: Medication[];
  editingStage: Stage;
  setEditingStage: React.Dispatch<React.SetStateAction<Stage | null>>;
  setIsStageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveStage: (stage: Stage) => void;
  handleDeleteStage: (id: string) => void;
};

export default function StageModal({ medications, editingStage, setEditingStage, setIsStageModalOpen, handleSaveStage, handleDeleteStage }: StageModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">

        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">
            {editingStage.id ? 'עריכת שלב בפרוטוקול' : 'הוספת שלב חדש'}
          </h3>
          <button
            onClick={() => setIsStageModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">שם השלב / הבדיקה:</label>
            <input
              type="text"
              value={editingStage.title}
              onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="לדוגמה: אולטראסאונד זקיקים חוזר"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">מתחיל ביום למחזור (D#):</label>
              <input
                type="number"
                min="1"
                value={editingStage.relativeStartDay}
                onChange={(e) => setEditingStage({ ...editingStage, relativeStartDay: parseInt(e.target.value) || 1 })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">משך בימים:</label>
              <input
                type="number"
                min="1"
                value={editingStage.durationDays}
                onChange={(e) => setEditingStage({ ...editingStage, durationDays: parseInt(e.target.value) || 1 })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">שיוך לתרופה (אופציונלי):</label>
            <select
              value={editingStage.medicationId}
              onChange={(e) => setEditingStage({ ...editingStage, medicationId: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
            >
              <option value="">-- ללא שיוך תרופתי (בדיקה/מנוחה) --</option>
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">תיאור והנחיות:</label>
            <textarea
              value={editingStage.description}
              onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="הנחיות, תוצאות בדיקת דם מבוקשות וכדומה"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {editingStage.id && (
            <button
              type="button"
              onClick={() => handleDeleteStage(editingStage.id)}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold"
            >
              מחק שלב זה
            </button>
          )}
          <div className="flex gap-2 mr-auto">
            <button
              type="button"
              onClick={() => setIsStageModalOpen(false)}
              className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={() => handleSaveStage(editingStage)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs"
            >
              שמור שלב
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
