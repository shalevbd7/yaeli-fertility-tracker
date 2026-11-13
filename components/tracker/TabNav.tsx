"use client";

import type React from 'react';
import type { TabId } from '@/lib/tracker/types';
import type { TabDef } from '@/lib/tracker/tabs';

type TabNavProps = {
  tabs: TabDef[];
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
  /** Optional count shown as a small badge on a tab (e.g. pending requests on Settings). */
  badges?: Record<string, number>;
};

export default function TabNav({ tabs, activeTab, setActiveTab, badges = {} }: TabNavProps) {
  return (
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar py-2 text-sm font-medium">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id
            ? 'bg-rose-500 text-white shadow-sm font-semibold'
            : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
            }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {(badges[tab.id] ?? 0) > 0 && (
            <span
              className="min-w-5 h-5 px-1.5 rounded-full bg-amber-400 text-white text-[11px] font-bold flex items-center justify-center"
              aria-label={`${badges[tab.id]} ממתינים`}
            >
              {badges[tab.id]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
