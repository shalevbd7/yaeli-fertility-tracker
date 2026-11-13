"use client";

import { signOut } from 'next-auth/react';
import type { AccountRole } from '@/hooks/useAccount';

/** Shown to a partner account that has no tracker access (yet). */
export default function AccessStatusScreen({ role }: { role: AccountRole | undefined }) {
  const pending = role === 'pending';
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-5">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
        {pending ? '⏳' : '🔒'}
      </div>
      <h2 className="text-2xl font-bold text-slate-800">
        {pending ? 'הבקשה ממתינה לאישור' : 'אין גישה למעקב'}
      </h2>
      <p className="text-slate-600 leading-relaxed">
        {pending
          ? 'שלחת בקשה להצטרף למעקב המשותף. ברגע שבעלת המעקב תאשר, המעקב יופיע כאן אוטומטית.'
          : 'החשבון הזה אינו מחובר כרגע למעקב. כדי להצטרף, בקשו מבעלת המעקב קישור הזמנה חדש.'}
      </p>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 px-4 py-2 rounded-xl cursor-pointer transition"
      >
        התנתקות
      </button>
    </div>
  );
}
