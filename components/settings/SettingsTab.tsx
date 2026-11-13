"use client";

import type React from 'react';
import type { Account } from '@/hooks/useAccount';
import PartnerSettings from './PartnerSettings';

type SettingsTabProps = {
  account: Account | null;
  accountError: boolean;
  refreshAccount: () => Promise<void>;
  showToast: (message: string, type?: string) => void;
  /** Extra owner-only sections (e.g. pregnancy mode), rendered after the partner section. */
  children?: React.ReactNode;
};

export default function SettingsTab({ account, accountError, refreshAccount, showToast, children }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>⚙️</span>
          <span>הגדרות</span>
        </h2>
        {account && (
          <p className="text-sm text-slate-500 mt-1">
            מחובר/ת כ-<span dir="ltr">{account.user.email}</span>
            {account.isTestAccount && (
              <span className="mr-2 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">חשבון בדיקה – ללא טלגרם</span>
            )}
          </p>
        )}
      </div>

      {!account && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4">
          {accountError ? 'לא הצלחנו לטעון את פרטי החשבון. נסי לרענן את הדף.' : 'טוענים...'}
        </div>
      )}

      {account && (
        <PartnerSettings account={account} refreshAccount={refreshAccount} showToast={showToast} />
      )}

      {account?.role === 'owner' && children}
    </div>
  );
}
