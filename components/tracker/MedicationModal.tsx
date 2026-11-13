"use client";

import type React from 'react';
import type { Medication } from '@/lib/tracker/types';

type MedicationModalProps = {
  editingMed: Medication;
  setEditingMed: React.Dispatch<React.SetStateAction<Medication | null>>;
  setIsMedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveMedication: (med: Medication) => void;
  handleDeleteMedication: (id: string) => void;
};

export default function MedicationModal({ editingMed, setEditingMed, setIsMedModalOpen, handleSaveMedication, handleDeleteMedication }: MedicationModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">

        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">
            {editingMed.id ? 'עריכת תרופה בארון' : 'הוספת תרופה חדשה'}
          </h3>
          <button
            onClick={() => setIsMedModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">שם התרופה / הזריקה:</label>
            <input
              type="text"
              value={editingMed.name}
              onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="למשל: לטרוזול / אוביטרל"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">מינון בכל מנה:</label>
              <input
                type="text"
                value={editingMed.dosage}
                onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                placeholder="1 כדור (2.5 מ״ג)"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">מספר מנות ביום:</label>
              <input
                type="number"
                min="1"
                max="6"
                value={editingMed.timesPerDay}
                onChange={(e) => setEditingMed({ ...editingMed, timesPerDay: parseInt(e.target.value) || 1 })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-bold text-slate-700 mb-1">לכמה ימים לקחת? (0 = קבוע ללא הגבלה):</label>
              <input
                type="number"
                min="0"
                value={editingMed.durationDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setEditingMed({ ...editingMed, durationDays: val, isContinuous: val === 0 });
                }}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">שעת תזכורת (מופרד בפסיק):</label>
              <input
                type="text"
                value={editingMed.hours.join(', ')}
                onChange={(e) => setEditingMed({ ...editingMed, hours: e.target.value.split(',').map(s => s.trim()) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                placeholder="08:00, 20:00"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">הערות נוספות והנחיות:</label>
            <textarea
              value={editingMed.notes}
              onChange={(e) => setEditingMed({ ...editingMed, notes: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="עם האוכל, לשמור במקרר וכו'"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {editingMed.id && (
            <button
              type="button"
              onClick={() => handleDeleteMedication(editingMed.id)}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold"
            >
              מחק תרופה זו
            </button>
          )}
          <div className="flex gap-2 mr-auto">
            <button
              type="button"
              onClick={() => setIsMedModalOpen(false)}
              className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={() => handleSaveMedication(editingMed)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              שמור תרופה
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
