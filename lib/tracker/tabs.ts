export type TabDef = { id: string; label: string; icon: string };

// The original fertility tabs, unchanged, followed by Settings.
export const FERTILITY_TABS: TabDef[] = [
  { id: 'dashboard', label: 'דשבורד ראשי', icon: '🏠' },
  { id: 'timeline', label: 'ציר זמן ושלבי טיפול', icon: '⏳' },
  { id: 'calendar', label: 'לוח שנה (Calendar)', icon: '📅' },
  { id: 'meds', label: 'ארון תרופות ותזכורות', icon: '💊' },
  { id: 'architecture', label: 'ארכיטקטורה וסטאק', icon: '🛠️' },
];

export const SETTINGS_TAB: TabDef = { id: 'settings', label: 'הגדרות', icon: '⚙️' };
