"use client";

import type React from 'react';

type ResetCycleModalProps = {
  setIsResetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetDate: string;
  setResetDate: React.Dispatch<React.SetStateAction<string>>;
  resetTime: string;
  setResetTime: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmReset: () => void;
};

export default function ResetCycleModal({ setIsResetModalOpen, resetDate, setResetDate, resetTime, setResetTime, handleConfirmReset }: ResetCycleModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">

        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">
            הזנת מחזור חדש 🌸
          </h3>
          <button
            onClick={() => setIsResetModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            הזינו את התאריך והשעה. אם השעה היא אחרי 17:00, המערכת תחשב אוטומטית את יום 1 החל ממחר.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-sm">תאריך:</label>
            <input
              type="date"
              value={resetDate}
              onChange={(e) => setResetDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-sm">שעה:</label>
            <input
              type="time"
              value={resetTime}
              onChange={(e) => setResetTime(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(false)}
            className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleConfirmReset}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
          >
            עדכן מחזור והתחל
          </button>
        </div>

      </div>
    </div>
  );
}
