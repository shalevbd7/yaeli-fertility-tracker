"use client";

import type React from 'react';
import { getColorClasses } from '@/lib/tracker/colors';
import type { Medication } from '@/lib/tracker/types';

type MedsTabProps = {
  medications: Medication[];
  sendingMedId: string | null;
  setEditingMed: React.Dispatch<React.SetStateAction<Medication | null>>;
  setIsMedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sendTelegramReminder: (med: Medication, customTime?: string) => void;
};

export default function MedsTab({ medications, sendingMedId, setEditingMed, setIsMedModalOpen, sendTelegramReminder }: MedsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>💊</span>
              <span>ארון התרופות והתזכורות של יעלי</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              הגדרת מינונים, מספר מנות יומי, שעות מדויקות ותזכורות ישירות לוואטסאפ או SMS.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingMed({
                id: '',
                name: '',
                dosage: '1 כדור',
                timesPerDay: 1,
                hours: ['09:00'],
                durationDays: 5,
                isContinuous: false,
                notes: '',
                color: 'rose'
              });
              setIsMedModalOpen(true);
            }}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>הוסף תרופה חדשה לארון</span>
          </button>
        </div>

        {/* Medication Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {medications.map(med => {
            const colors = getColorClasses(med.color);
            return (
              <div
                key={med.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-rose-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💊</span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{med.name}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${colors.badge}`}>
                          {med.dosage}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingMed(med);
                          setIsMedModalOpen(true);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100"
                        title="ערוך תרופה"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {med.notes || 'ללא הערות מיוחדות'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="font-semibold text-slate-800">מנות ביום: </span>
                      {med.timesPerDay}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">משך נטילה: </span>
                      {med.isContinuous ? 'קבוע (ללא הגבלה)' : `${med.durationDays} ימים`}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-800">שעות תזכורת: </span>
                      {med.hours.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Reminder Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => sendTelegramReminder(med, med.hours[0])}
                    disabled={sendingMedId === med.id}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>✈️</span>
                    <span>{sendingMedId === med.id ? 'שולח תזכורת...' : 'שלח תזכורת מיידית לטלגרם'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
