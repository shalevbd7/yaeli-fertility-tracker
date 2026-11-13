"use client";

import type React from 'react';
import { signOut } from 'next-auth/react';
import TabNav from './TabNav';
import type { CycleMetrics, TabId } from '@/lib/tracker/types';

type AppHeaderProps = {
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
  hasCycle: boolean;
  isLoading: boolean;
  isSaving: boolean;
  saveError: string | null;
  cycleMetrics: CycleMetrics;
};

export default function AppHeader({ activeTab, setActiveTab, hasCycle, isLoading, isSaving, saveError, cycleMetrics }: AppHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-rose-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-300 flex items-center justify-center text-white text-xl shadow-sm">
            🌸
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              המסע שלנו
            </h1>
            <p className="text-xs text-rose-400 font-medium">מעקב פשוט בתהליך מורכב</p>
          </div>
        </div>

        {/* Quick cycle status indicator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
            title="התנתקות"
          >
            יציאה
          </button>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              טוען...
            </span>
          )}
          {!isLoading && isSaving && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              שומר...
            </span>
          )}
          {!isLoading && !isSaving && saveError && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={saveError}>
              שגיאת שמירה
            </span>
          )}
          {hasCycle ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              יום {cycleMetrics.cycleDay} למחזור
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              ממתינים למחזור
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </header>
  );
}
