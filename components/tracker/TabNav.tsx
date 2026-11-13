"use client";

import type React from 'react';
import type { TabId } from '@/lib/tracker/types';

type TabNavProps = {
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
};

export default function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  return (
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar py-2 text-sm font-medium">
      {[
        { id: 'dashboard', label: 'דשבורד ראשי', icon: '🏠' },
        { id: 'timeline', label: 'ציר זמן ושלבי טיפול', icon: '⏳' },
        { id: 'calendar', label: 'לוח שנה (Calendar)', icon: '📅' },
        { id: 'meds', label: 'ארון תרופות ותזכורות', icon: '💊' },
        { id: 'architecture', label: 'ארכיטקטורה וסטאק', icon: '🛠️' }
      ].map(tab => (
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
        </button>
      ))}
    </nav>
  );
}
