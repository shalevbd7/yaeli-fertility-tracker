"use client";

import { useState } from 'react';
import { ROUTINE_CHECKUPS_NOTE, TEST_KIND_LABELS } from '@/lib/content/pregnancy';
import { formatYmd, newId, type TestRow } from '@/lib/pregnancy/view';
import type { PregnancyTest } from '@/lib/tracker/types';
import MedicalDisclaimer from './MedicalDisclaimer';

type PregnancyTestsProps = {
  rows: TestRow[];
  onSaveTest: (test: PregnancyTest) => void;
  onDeleteTest: (id: string) => void;
};

const STATUS_STYLE: Record<TestRow['status'], { label: string; cls: string }> = {
  done: { label: '✓ בוצעה', cls: 'bg-emerald-100 text-emerald-800' },
  scheduled: { label: 'נקבע תור', cls: 'bg-blue-100 text-blue-800' },
  'due-now': { label: 'זה הזמן', cls: 'bg-rose-500 text-white' },
  upcoming: { label: 'בהמשך', cls: 'bg-slate-100 text-slate-600' },
  past: { label: 'החלון עבר', cls: 'bg-amber-100 text-amber-800' },
};

const KIND_STYLE: Record<string, string> = {
  routine: 'bg-rose-50 text-rose-700 border-rose-200',
  conditional: 'bg-purple-50 text-purple-700 border-purple-200',
  optional: 'bg-slate-50 text-slate-600 border-slate-200',
};

type Filter = 'all' | 'open' | 'done';

export default function PregnancyTests({ rows, onSaveTest, onDeleteTest }: PregnancyTestsProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ test: PregnancyTest; isCustom: boolean; title: string } | null>(null);

  const visible = rows.filter((r) =>
    filter === 'all' ? true : filter === 'done' ? r.status === 'done' : r.status !== 'done'
  );

  const openEditor = (row: TestRow) => {
    const isCustom = !row.standard;
    setEditing({
      isCustom,
      title: row.name,
      test: row.record ?? {
        id: newId('pt'),
        standardKey: row.standard?.key ?? '',
        name: row.standard?.name ?? '',
        date: '',
        location: '',
        done: false,
        notes: '',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🩺</span>
              <span>בדיקות ההריון</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              הבדיקות המקובלות בישראל, עם החלון המומלץ לפי תאריך ההריון שלך. אפשר לרשום תאריך, מקום ולסמן מה בוצע.
            </p>
          </div>
          <button
            onClick={() =>
              setEditing({
                isCustom: true,
                title: 'בדיקה חדשה',
                test: { id: newId('pt'), standardKey: '', name: '', date: '', location: '', done: false, notes: '' },
              })
            }
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>הוספת בדיקה משלי</span>
          </button>
        </div>

        <div className="flex gap-2 mt-5 text-xs font-semibold">
          {([['all', 'הכול'], ['open', 'לביצוע'], ['done', 'בוצעו']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === id ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {visible.map((row) => {
            const st = STATUS_STYLE[row.status];
            const isOpen = expanded === row.key;
            return (
              <div
                key={row.key}
                className={`p-4 rounded-2xl border transition ${row.status === 'due-now' ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{row.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                      {row.standard ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${KIND_STYLE[row.standard.kind]}`}>
                          {TEST_KIND_LABELS[row.standard.kind]}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">בדיקה אישית</span>
                      )}
                    </div>
                    {row.standard && (
                      <p className="text-xs text-slate-600">
                        ⏱ {row.standard.windowLabel}
                        {row.windowFrom && (
                          <span className="text-slate-400"> ({formatYmd(row.windowFrom)} – {formatYmd(row.windowTo)})</span>
                        )}
                      </p>
                    )}
                    {row.standard?.audience && <p className="text-xs text-purple-700">👥 {row.standard.audience}</p>}
                    {row.record && (row.record.date || row.record.location) && (
                      <p className="text-xs text-blue-800">
                        📅 {row.record.date ? formatYmd(row.record.date) : 'ללא תאריך'}
                        {row.record.location ? ` · 📍 ${row.record.location}` : ''}
                      </p>
                    )}
                    {row.record?.notes && <p className="text-xs text-slate-500">📝 {row.record.notes}</p>}
                    {row.standard && isOpen && (
                      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                        <p>{row.standard.description}</p>
                        {row.standard.notes && <p className="text-slate-500">{row.standard.notes}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {row.standard && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : row.key)}
                        className="text-xs text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        {isOpen ? 'פחות' : 'מה זה?'}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        onSaveTest({
                          ...(row.record ?? {
                            id: newId('pt'),
                            standardKey: row.standard?.key ?? '',
                            name: row.standard?.name ?? row.name,
                            date: '',
                            location: '',
                            notes: '',
                          }),
                          done: !(row.record?.done ?? false),
                        } as PregnancyTest)
                      }
                      className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer ${row.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-slate-600 border-slate-200 hover:bg-emerald-50'}`}
                      title="סימון כבוצע / לא בוצע"
                    >
                      {row.status === 'done' ? '✓ בוצעה' : 'סמני כבוצעה'}
                    </button>
                    <button
                      onClick={() => openEditor(row)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      ערוך ✏️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {visible.length === 0 && <p className="text-sm text-slate-500 text-center py-6">אין בדיקות להצגה.</p>}
        </div>

        <p className="text-xs text-slate-500 mt-5">{ROUTINE_CHECKUPS_NOTE}</p>
      </div>

      <MedicalDisclaimer />

      {editing && (
        <TestModal
          title={editing.title}
          isCustom={editing.isCustom}
          test={editing.test}
          canDelete={rows.some((r) => r.record?.id === editing.test.id)}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            onSaveTest(t);
            setEditing(null);
          }}
          onDelete={() => {
            onDeleteTest(editing.test.id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TestModal({
  title,
  isCustom,
  test,
  canDelete,
  onClose,
  onSave,
  onDelete,
}: {
  title: string;
  isCustom: boolean;
  test: PregnancyTest;
  canDelete: boolean;
  onClose: () => void;
  onSave: (t: PregnancyTest) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<PregnancyTest>(test);
  const valid = !isCustom || draft.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">
        <div className="flex justify-between items-center border-b border-rose-100 pb-3">
          <h3 className="font-bold text-lg text-slate-900">{title || 'בדיקה'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 text-xs">
          {isCustom && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">שם הבדיקה:</label>
              <input
                type="text"
                value={draft.name}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                placeholder="לדוגמה: בדיקת ברזל חוזרת"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">תאריך:</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">מקום:</label>
              <input
                type="text"
                value={draft.location}
                maxLength={200}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                placeholder="מרפאה / מכון / בית חולים"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.done}
              onChange={(e) => setDraft({ ...draft, done: e.target.checked })}
              className="w-4 h-4 rounded text-rose-600"
            />
            הבדיקה בוצעה
          </label>
          <div>
            <label className="block font-bold text-slate-700 mb-1">הערות:</label>
            <textarea
              value={draft.notes}
              rows={2}
              maxLength={1000}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
              placeholder="הכנה לבדיקה, תוצאות, שאלות לרופא/ה"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {canDelete && (
            <button type="button" onClick={onDelete} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">
              {isCustom ? 'מחיקת הבדיקה' : 'ניקוי הפרטים'}
            </button>
          )}
          <div className="flex gap-2 mr-auto">
            <button type="button" onClick={onClose} className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
              ביטול
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => onSave({ ...draft, name: draft.name.trim() })}
              className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
            >
              שמירה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
