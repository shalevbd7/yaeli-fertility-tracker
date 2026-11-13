"use client";

import { useState } from 'react';
import type { Account } from '@/hooks/useAccount';
import { formatDateIsraeli } from '@/lib/tracker/dates';

type PartnerSettingsProps = {
  account: Account;
  refreshAccount: () => Promise<void>;
  showToast: (message: string, type?: string) => void;
};

const ERRORS: Record<string, string> = {
  'already-linked': 'כבר יש שותף/ה מחובר/ת למעקב.',
  'request-pending': 'יש בקשת הצטרפות שממתינה להחלטה שלך.',
  'requester-already-linked': 'החשבון הזה כבר מחובר למעקב אחר.',
  'rate-limited': 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.',
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** Partner linking section of Settings (owner and partner views). */
export default function PartnerSettings({ account, refreshAccount, showToast }: PartnerSettingsProps) {
  const [busy, setBusy] = useState(false);
  const [newLink, setNewLink] = useState<{ url: string; expiresAt: string } | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; data: { error?: string } }>, success: string) => {
    setBusy(true);
    try {
      const { ok, data } = await fn();
      if (!ok) {
        showToast(ERRORS[data?.error ?? ''] ?? 'הפעולה נכשלה. נסי שוב בעוד רגע.', 'error');
        return false;
      }
      showToast(success);
      return true;
    } catch {
      showToast('הפעולה נכשלה. נסי שוב בעוד רגע.', 'error');
      return false;
    } finally {
      setBusy(false);
      await refreshAccount();
    }
  };

  const createInvite = async () => {
    setBusy(true);
    try {
      const { ok, data } = await call('/api/invites', 'POST');
      if (!ok) {
        showToast(ERRORS[data?.error ?? ''] ?? 'יצירת הקישור נכשלה.', 'error');
        return;
      }
      setNewLink({ url: data.url, expiresAt: data.expiresAt });
    } catch {
      showToast('יצירת הקישור נכשלה.', 'error');
    } finally {
      setBusy(false);
      await refreshAccount();
    }
  };

  const copyLink = async () => {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink.url);
      showToast('הקישור הועתק 📋');
    } catch {
      showToast('לא הצלחנו להעתיק. סמני את הקישור והעתיקי ידנית.', 'error');
    }
  };

  // ---------- Partner view ----------
  if (account.role === 'partner') {
    return (
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span>💞</span>
          <span>מעקב משותף</span>
        </h3>
        <p className="text-sm text-slate-600">
          את/ה מחובר/ת למעקב של <strong>{account.owner?.name || 'בעלת המעקב'}</strong> ויכול/ה לראות ולערוך את כל הנתונים.
          הגדרות, הזמנות ומצב הריון מנוהלים על ידי בעלת המעקב.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!window.confirm('לצאת מהמעקב המשותף? הגישה תיחסם מיד.')) return;
            run(() => call('/api/partner', 'DELETE'), 'יצאת מהמעקב המשותף').then((ok) => {
              if (ok) window.location.reload();
            });
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          יציאה מהמעקב המשותף
        </button>
      </section>
    );
  }

  // ---------- Owner view ----------
  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-5">
      <div>
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span>💞</span>
          <span>שותף/ה למסע</span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          חברו את החשבון של בן/בת הזוג, כדי ששניכם תראו ותעדכנו את אותו מעקב.
        </p>
      </div>

      {/* Pending requests */}
      {account.pendingRequests.length > 0 && (
        <div className="space-y-3">
          {account.pendingRequests.map((req) => (
            <div key={req.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-3">
              <div className="text-sm text-amber-900">
                <strong>{req.name}</strong> (<span dir="ltr">{req.email}</span>) מבקש/ת להצטרף למעקב שלך.
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => call(`/api/partner/requests/${req.id}`, 'POST', { action: 'approve' }), 'החשבונות חוברו בהצלחה ❤️')}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  אישור
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => call(`/api/partner/requests/${req.id}`, 'POST', { action: 'reject' }), 'הבקשה נדחתה')}
                  className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  דחייה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linked partner */}
      {account.partner ? (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-3">
          <div className="text-sm text-emerald-900">
            ✓ <strong>{account.partner.name}</strong> (<span dir="ltr">{account.partner.email}</span>) מחובר/ת ויכול/ה לראות ולערוך את המעקב.
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm('לנתק את השותף/ה? הגישה שלו/ה תיחסם מיד. הנתונים שלך לא ישתנו.')) return;
              run(() => call('/api/partner', 'DELETE'), 'השותף/ה נותק/ה');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            ניתוק השותף/ה
          </button>
        </div>
      ) : account.pendingRequests.length === 0 && (
        <div className="space-y-3">
          {newLink ? (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-3">
              <p className="text-sm text-rose-900 font-semibold">הקישור מוכן! שלחי אותו לבן/בת הזוג:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={newLink.url}
                  dir="ltr"
                  onFocus={(e) => e.target.select()}
                  className="flex-grow border border-rose-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  העתקה
                </button>
              </div>
              <p className="text-xs text-rose-700">
                הקישור תקף לשימוש אחד בלבד, עד {formatDateIsraeli(newLink.expiresAt)} (48 שעות). מטעמי אבטחה הוא מוצג רק עכשיו.
              </p>
            </div>
          ) : account.invite?.state === 'active' ? (
            <p className="text-sm text-slate-600">
              יש קישור הזמנה פעיל עד {formatDateIsraeli(account.invite.expiresAt)}. אפשר ליצור קישור חדש (הקודם יבוטל) או לבטל אותו.
            </p>
          ) : (
            <p className="text-sm text-slate-600">עדיין לא חיברת שותף/ה.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={createInvite}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {account.invite?.state === 'active' || newLink ? 'יצירת קישור חדש' : 'יצירת קישור הזמנה'}
            </button>
            {(account.invite?.state === 'active' || newLink) && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => call('/api/invites', 'DELETE'), 'הקישור בוטל').then(() => setNewLink(null))
                }
                className="text-xs text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                ביטול הקישור
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
