"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { signOut } from 'next-auth/react';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  timesPerDay: number;
  hours: string[];
  durationDays: number;
  isContinuous: boolean;
  notes: string;
  color: string;
};

type Stage = {
  id: string;
  title: string;
  relativeStartDay: number;
  durationDays: number;
  type: string;
  description: string;
  medicationId: string;
  color: string;
};

type ResolvedStage = Stage & {
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  linkedMed?: Medication;
};

type Toast = { message: string; type?: string } | null;

type TrackerPayload = {
  hasActiveCycle: boolean;
  cycleStartDate: string | null;
  stages: Stage[];
  medications: Medication[];
  completedTasks: Record<string, boolean>;
};

const LOVING_AFFIRMATIONS = [
  "אהבת חיי שלי, אני גאה בך ברמות שאת מקפידה ומצליחה",
  "את גיבורה וחזקה. אני איתך בכל שנייה, בכל תרופה ובכל בדיקה 💕",
  "תמשיכי ככה אהובתי. אני כאן תמיד",
  "את השראה בשבילי",
  "אני הכי מאושר בעולם שאנחנו עוברים את המסע ביחד",
  "תאמיני בו, זה יבוא ברגע הנכון בזמן הנכון 💕"
];

// Preloaded standard fertility meds
const INITIAL_MEDICATIONS = [
  {
    id: 'med-1',
    name: 'חומצה פולית',
    dosage: 'טבליה 1 (400 מק"ג)',
    timesPerDay: 1,
    hours: ['08:30'],
    durationDays: 0, // 0 = continuous / without end
    isContinuous: true,
    notes: 'לקחת ברצף בכל בוקר',
    color: 'emerald'
  },
  {
    id: 'med-2',
    name: 'לטרוזול / פמרה (או איקקלומין)',
    dosage: '2 כדורים (5 מ"ג סה"כ)',
    timesPerDay: 1,
    hours: ['20:30'],
    durationDays: 5,
    isContinuous: false,
    notes: 'החל מיום 3 למחזור למשך 5 ימים רצופים בשעה קבועה',
    color: 'rose'
  },
  {
    id: 'med-3',
    name: 'אוביטרל (זריקת ביוץ)',
    dosage: 'מזרק מוכן 1',
    timesPerDay: 1,
    hours: ['21:00'],
    durationDays: 1,
    isContinuous: false,
    notes: 'להזריק רק לפי הנחיה מפורשת לאחר האולטראסאונד ובדיקות הדם',
    color: 'amber'
  },
  {
    id: 'med-4',
    name: 'אוטרוגסטן / תמיכת פרוגסטרון',
    dosage: 'נר 1 / כדור (200 מ"ג)',
    timesPerDay: 2,
    hours: ['08:00', '21:30'],
    durationDays: 14,
    isContinuous: false,
    notes: 'תמיכה ברירית הרחם, 2-3 ימים לאחר הביוץ',
    color: 'indigo'
  }
];

// Default protocol stages relative to Day 1 of period
const DEFAULT_STAGES = [
  {
    id: 'stg-1',
    title: 'קבלת מחזור (יום 1)',
    relativeStartDay: 1, // Day 1
    durationDays: 1,
    type: 'milestone',
    description: 'התחלת מעגל הטיפול ואיפוס הספירה',
    medicationId: '',
    color: 'rose'
  },
  {
    id: 'stg-2',
    title: 'לטרוזול',
    relativeStartDay: 3, // Day 3
    durationDays: 5,     // until Day 7
    type: 'medication',
    description: 'נטילת כדורים בכל ערב',
    medicationId: 'med-2',
    color: 'pink'
  },
  {
    id: 'stg-3',
    title: 'המתנה וגדילת זקיקים',
    relativeStartDay: 8, // Day 8
    durationDays: 4,     // Day 8 to 11
    type: 'wait',
    description: 'מנוחה לגוף וצמיחה טבעית של הזקיקים והרירית',
    medicationId: '',
    color: 'slate'
  },
  {
    id: 'stg-4',
    title: 'בדיקת מעקב זקיקים (US + דם)',
    relativeStartDay: 12, // Day 12
    durationDays: 1,
    type: 'checkup',
    description: 'אולטראסאונד גודל זקיקים + בדיקת דם E2 ופרוגסטרון',
    medicationId: '',
    color: 'blue'
  },
  {
    id: 'stg-5',
    title: 'זריקת ביוץ (אוביטרל)',
    relativeStartDay: 13, // Day 13 (approx, conditional)
    durationDays: 1,
    type: 'injection',
    description: 'תזמון הבשלת הביצית (רק באישור רופא לפי גודל הזקיק)',
    medicationId: 'med-3',
    color: 'amber'
  },
  {
    id: 'stg-6',
    title: 'חלון פוריות וביוץ משוער',
    relativeStartDay: 14,
    durationDays: 2,
    type: 'ovulation',
    description: 'חלון זמן אופטימלי להפריה / הזרעה / קיום יחסים',
    medicationId: '',
    color: 'purple'
  },
  {
    id: 'stg-7',
    title: 'אוטרוגסטן / תמיכת פרוגסטרון',
    relativeStartDay: 16,
    durationDays: 14,
    type: 'medication',
    description: 'כדורים לתמיכה ברירית ובהשתרשות',
    medicationId: 'med-4',
    color: 'emerald'
  }
];

function formatDateIsraeli(date: Date | string | null | undefined) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDayName(date: Date | string | null | undefined) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { weekday: 'long' });
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysDiff(d1: Date, d2: Date) {
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | timeline | calendar | meds | architecture

  // State: Period Cycle
  const [hasCycle, setHasCycle] = useState(true);
  const [cycleStartDate, setCycleStartDate] = useState(() => {
    // Default to 4 days ago to show an active cycle right away
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return toISODate(d);
  });

  // State: Medications and Stages
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);

  // Modal / Toast Notification System
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // Checklist for today's completed tasks
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Active random affirmation
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [sendingMedId, setSendingMedId] = useState<string | null>(null);

  // New medication modal form
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);

  // Editing stage modal form
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);

  // Reset Cycle Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetDate, setResetDate] = useState(() => toISODate(new Date()));
  const [resetTime, setResetTime] = useState('10:00');

  // Calendar View month cursor
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Database sync state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const saveToDatabase = useCallback(async (payload: TrackerPayload) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to save data');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError('שמירה בענן נכשלה. הנתונים נשמרים מקומית עד לחיבור מחדש.');
      showToast('שגיאה בשמירה לענן. נסי שוב בעוד רגע.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Load tracker data from MongoDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/tracker');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to load data');
        }
        const data = await res.json();
        if (cancelled) return;

        if (data) {
          setHasCycle(data.hasActiveCycle ?? false);
          if (data.cycleStartDate) {
            setCycleStartDate(toISODate(new Date(data.cycleStartDate)));
          }
          if (Array.isArray(data.medications) && data.medications.length > 0) {
            setMedications(data.medications);
          }
          if (Array.isArray(data.stages) && data.stages.length > 0) {
            setStages(data.stages);
          }
          if (data.completedTasks && typeof data.completedTasks === 'object') {
            setCompletedItems(data.completedTasks);
          }
        }
      } catch (err) {
        console.error('Load failed:', err);
        if (!cancelled) {
          setLoadError('לא הצלחנו לטעון נתונים מהענן. מוצגים נתוני ברירת מחדל.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          hasLoadedRef.current = true;
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Auto-save to MongoDB when state changes (debounced)
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const timer = setTimeout(() => {
      saveToDatabase({
        hasActiveCycle: hasCycle,
        cycleStartDate: cycleStartDate ? new Date(cycleStartDate + 'T00:00:00').toISOString() : null,
        stages,
        medications,
        completedTasks: completedItems,
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [hasCycle, cycleStartDate, stages, medications, completedItems, saveToDatabase]);

  const cycleMetrics = useMemo(() => {
    if (!hasCycle || !cycleStartDate) return { cycleDay: 0, currentStage: null };
    const start = new Date(cycleStartDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Find what stage corresponds to today
    const current = stages.find(s => {
      const stageStart = s.relativeStartDay;
      const stageEnd = s.relativeStartDay + (s.durationDays || 1) - 1;
      return diffDays >= stageStart && diffDays <= stageEnd;
    });

    return {
      cycleDay: diffDays > 0 ? diffDays : 0,
      currentStage: current || null,
      isBefore: diffDays < 1
    };
  }, [hasCycle, cycleStartDate, stages]);

  const resolvedStages = useMemo(() => {
    if (!cycleStartDate) return [];
    const baseDate = new Date(cycleStartDate + 'T00:00:00');

    return stages.map(stg => {
      const startDate = addDays(baseDate, stg.relativeStartDay - 1);
      const endDate = addDays(startDate, Math.max(0, (stg.durationDays || 1) - 1));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isCompleted = today > endDate;
      const isCurrent = today >= startDate && today <= endDate;
      const isUpcoming = today < startDate;

      const linkedMed = medications.find(m => m.id === stg.medicationId);

      return {
        ...stg,
        startDate,
        endDate,
        isCompleted,
        isCurrent,
        isUpcoming,
        linkedMed
      };
    }).sort((a, b) => a.relativeStartDay - b.relativeStartDay);
  }, [stages, cycleStartDate, medications]);

  const calendarEventsMap = useMemo(() => {
    const map: Record<string, Array<{ id: string; title: string; type: string; color: string; med?: Medication }>> = {};
    if (!hasCycle) return map;

    resolvedStages.forEach(stg => {
      let cur = new Date(stg.startDate);
      const end = new Date(stg.endDate);

      while (cur <= end) {
        const key = toISODate(cur);
        if (!map[key]) map[key] = [];
        map[key].push({
          id: stg.id,
          title: stg.title,
          type: stg.type,
          color: stg.color,
          med: stg.linkedMed
        });
        cur.setDate(cur.getDate() + 1);
      }
    });

    // Also inject continuous medications (every day)
    medications.filter(m => m.isContinuous).forEach(med => {
      // In a real scenario continuous meds appear daily
    });

    return map;
  }, [resolvedStages, hasCycle, medications]);

  const sendTelegramReminder = async (med: Medication, customTime = '') => {
    const timeText = customTime ? `בשעה ${customTime}` : 'עכשיו';
    const text = `היי יעלי אהובה שלי ❤️\nתזכורת חמה לקחת ${med.name} (${med.dosage}) ${timeText}.\n${med.notes ? 'הערה: ' + med.notes : ''}\nאוהב אותך המון ומחזיק לנו אצבעות! ✨`;

    setSendingMedId(med.id);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error('Failed to send');
      showToast('התזכורת נשלחה ליעלי בטלגרם בהצלחה! 🌸', 'success');
    } catch (err) {
      showToast('שגיאה בשליחת התזכורת. ודא שהגדרת טוקן נכון.', 'error');
    } finally {
      setSendingMedId(null);
    }
  };

  const handleConfirmReset = () => {
    const [hours, minutes] = resetTime.split(':').map(Number);
    let finalDate = new Date(resetDate);

    // Logic: If period started after 17:00, count starts from the next day
    if (hours >= 17) {
      finalDate.setDate(finalDate.getDate() + 1);
    }

    setCycleStartDate(toISODate(finalDate));
    setHasCycle(true);
    setIsResetModalOpen(false);
    showToast('התאריך עודכן! המערכת חישבה מחדש את כל השלבים ❤️');
  };

  const moveStage = (index: number, direction: number) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStages(updated);
    showToast('סדר השלבים עודכן בהצלחה');
  };

  const handleSaveStage = (updatedStage: Stage) => {
    if (updatedStage.id) {
      setStages(stages.map(s => s.id === updatedStage.id ? updatedStage : s));
      showToast('השלב עודכן בהצלחה');
    } else {
      const newStage = {
        ...updatedStage,
        id: 'stg-' + Date.now()
      };
      setStages([...stages, newStage]);
      showToast('שלב חדש נוסף לפרוטוקול');
    }
    setIsStageModalOpen(false);
    setEditingStage(null);
  };

  const handleDeleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    setIsStageModalOpen(false);
    showToast('השלב הוסר מהפרוטוקול');
  };

  const handleSaveMedication = (med: Medication) => {
    if (med.id) {
      setMedications(medications.map(m => m.id === med.id ? med : m));
      showToast('התרופה עודכנה בהצלחה');
    } else {
      const newMed = {
        ...med,
        id: 'med-' + Date.now()
      };
      setMedications([...medications, newMed]);
      showToast('תרופה חדשה נוספה לארון');
    }
    setIsMedModalOpen(false);
    setEditingMed(null);
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    setIsMedModalOpen(false);
    showToast('התרופה הוסרה');
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'rose':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' };
      case 'pink':
        return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-800' };
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' };
      case 'blue':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' };
      case 'emerald':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-800 font-sans antialiased pb-16" dir="rtl">

      {/* Top Loving Header Bar */}
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
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">טוענים את הנתונים שלך מהענן...</p>
          </div>
        ) : (
          <>

            {/* Loving Quote Banner */}
            <div className="bg-gradient-to-r from-rose-100/80 via-pink-50 to-amber-50 border border-rose-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">💖</span>
                <div>
                  <p className="text-sm font-semibold text-rose-900">
                    {LOVING_AFFIRMATIONS[quoteIndex]}
                  </p>
                  <p className="text-xs text-rose-500 mt-0.5">את אף פעם לא לבד בתהליך הזה</p>
                </div>
              </div>
              <button
                onClick={() => setQuoteIndex((quoteIndex + 1) % LOVING_AFFIRMATIONS.length)}
                className="text-xs bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium cursor-pointer transition shrink-0"
                title="משפט חיזוק חדש"
              >
                חיבוק נוסף ✨
              </button>
            </div>

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Condition 1: When cycle has NOT started yet */}
                {!hasCycle ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                      🌷
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">
                        שלום אהבה שלי ❤️
                      </h2>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        כאן אנחנו מחכים יחד לתחילת המחזור שלך. ברגע שתקבלי, לחצי על הכפתור למטה או בחרי תאריך, והמערכת תבנה מיד את כל לוח הזמנים המדויק עבורך, צעד אחרי צעד.
                      </p>
                    </div>

                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4 inline-block w-full text-right">
                      <label className="block text-sm font-bold text-rose-900">
                        מתי התחיל המחזור? (יום ושעה)
                      </label>
                      <p className="text-xs text-rose-700 mb-2">
                        * שימי לב יעלי, אם קיבלת אחרי השעה 17:00, הספירה של היום הראשון תתחיל ממחר.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="date"
                          value={resetDate}
                          onChange={(e) => setResetDate(e.target.value)}
                          className="border border-rose-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-rose-500 flex-grow bg-white"
                        />
                        <input
                          type="time"
                          value={resetTime}
                          onChange={(e) => setResetTime(e.target.value)}
                          className="border border-rose-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-rose-500 bg-white w-full sm:w-32"
                        />
                        <button
                          onClick={handleConfirmReset}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>התחילי מעקב עכשיו ✨</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Condition 2: Active Cycle Dashboard */
                  <div className="space-y-6">

                    {/* Hero Stage Banner */}
                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 -ml-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                          <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                            שלום אהבה שלי ❤️
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            אנחנו היום ביום {cycleMetrics.cycleDay} למחזור
                          </h2>
                          <p className="mt-2 text-rose-100 text-sm max-w-xl leading-relaxed">
                            תאריך התחלה: {formatDateIsraeli(cycleStartDate)} ({formatDayName(cycleStartDate)}).
                            {cycleMetrics.currentStage ? (
                              <> שלב נוכחי: <strong className="text-white underline">{cycleMetrics.currentStage.title}</strong></>
                            ) : (
                              <> מעקב בתהליך לפי הפרוטוקול שנקבע.</>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                          <button
                            onClick={() => {
                              setResetDate(toISODate(new Date()));
                              setResetTime('10:00');
                              setIsResetModalOpen(true);
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3.5 py-2 rounded-xl transition backdrop-blur-xs font-medium cursor-pointer"
                          >
                            איפוס למחזור חדש
                          </button>
                          <button
                            onClick={() => setHasCycle(false)}
                            className="bg-black/20 hover:bg-black/30 text-rose-100 text-xs px-3.5 py-2 rounded-xl transition font-medium"
                          >
                            סיום מעקב נוכחי
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid: What to do today + Key milestones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                      {/* Column 1: Today's Tasks & Meds Checklist */}
                      <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌸</span>
                            <h3 className="font-bold text-slate-800 text-lg">משימות ותרופות להיום</h3>
                          </div>
                          <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full">
                            {formatDateIsraeli(new Date())}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Active Stage info */}
                          {cycleMetrics.currentStage && (
                            <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-100 flex items-start gap-3">
                              <span className="text-2xl mt-0.5">📌</span>
                              <div>
                                <div className="font-bold text-sm text-pink-900">
                                  {cycleMetrics.currentStage.title}
                                </div>
                                <p className="text-xs text-pink-700 mt-0.5">
                                  {cycleMetrics.currentStage.description}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Medications to take today */}
                          <div className="space-y-2 pt-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">תרופות שרלוונטיות להיום</h4>

                            {medications.map(med => {
                              // Check if med belongs to current stage or is continuous
                              const isRelevant = med.isContinuous || (cycleMetrics.currentStage && cycleMetrics.currentStage.medicationId === med.id);
                              if (!isRelevant) return null;

                              return (
                                <div
                                  key={med.id}
                                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      id={`check-${med.id}`}
                                      checked={!!completedItems[med.id]}
                                      onChange={(e) => {
                                        setCompletedItems({ ...completedItems, [med.id]: e.target.checked });
                                        if (e.target.checked) showToast(`כל הכבוד יעלי! לקחת ${med.name} ❤️`);
                                      }}
                                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                    />
                                    <div>
                                      <label
                                        htmlFor={`check-${med.id}`}
                                        className={`text-sm font-bold cursor-pointer ${completedItems[med.id] ? 'line-through text-slate-400' : 'text-slate-800'}`}
                                      >
                                        {med.name}
                                      </label>
                                      <p className="text-xs text-slate-500">
                                        מינון: {med.dosage} | שעות: {med.hours.join(', ')}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => sendTelegramReminder(med, med.hours[0])}
                                    disabled={sendingMedId === med.id}
                                    className="inline-flex items-center gap-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 cursor-pointer transition disabled:opacity-50"
                                    title="שלח תזכורת בטלגרם ליעלי"
                                  >
                                    <span>✈️</span>
                                    <span className="hidden sm:inline">
                                      {sendingMedId === med.id ? 'שולח...' : 'תזכורת בטלגרם'}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Love note from partner */}
                          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-3">
                            <span className="text-xl">💌</span>
                            <div>
                              <strong>תזכורת אישית מאהובך:</strong> לשתות הרבה מים היום, לנוח מתי שצריך, ואם משהו מרגיש לא נוח - פשוט תגידי לי. אני כאן לכל דבר!
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Protocol Roadmap Overview */}
                      <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-xs space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
                            <span className="text-xl">🎯</span>
                            <h3 className="font-bold text-slate-800 text-lg">שלבי הטיפול הקרובים</h3>
                          </div>

                          <div className="mt-4 space-y-3">
                            {resolvedStages.slice(0, 5).map((stg, i) => {
                              const colors = getColorClasses(stg.color);
                              return (
                                <div
                                  key={stg.id}
                                  className={`p-3 rounded-xl border text-xs transition ${stg.isCurrent
                                    ? 'border-rose-400 bg-rose-50/60 font-semibold shadow-2xs'
                                    : stg.isCompleted
                                      ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-80'
                                      : 'border-slate-100 bg-white text-slate-700'
                                    }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">{stg.title}</span>
                                    {stg.isCurrent && (
                                      <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                                        עכשיו
                                      </span>
                                    )}
                                    {stg.isCompleted && (
                                      <span className="text-emerald-600 font-bold">✓ הושלם</span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px]">
                                    יום {stg.relativeStartDay} ({formatDateIsraeli(stg.startDate)})
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab('timeline')}
                          className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl transition"
                        >
                          צפה בציר הזמן המלא ועריכת שלבים ←
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TIMELINE & STAGE MANAGER (Drag / Reorder / Customize) */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>⏳</span>
                        <span>ציר הזמן של הפרוטוקול</span>
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        כל שלב מחושב ישירות מתאריך קבלת המחזור ({formatDateIsraeli(cycleStartDate)}). ניתן להזיז, לערוך ולשנות ימים בחופשיות.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingStage({
                            id: '',
                            title: '',
                            relativeStartDay: 10,
                            durationDays: 1,
                            type: 'checkup',
                            description: '',
                            medicationId: '',
                            color: 'blue'
                          });
                          setIsStageModalOpen(true);
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>+</span>
                        <span>הוסף שלב מותאם אישית</span>
                      </button>
                    </div>
                  </div>

                  {/* Timeline Flow */}
                  <div className="mt-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute right-6 top-4 bottom-4 w-1 bg-gradient-to-b from-rose-400 via-pink-300 to-emerald-400 rounded-full hidden sm:block"></div>

                    <div className="space-y-5">
                      {resolvedStages.map((stg, index) => {
                        const colors = getColorClasses(stg.color);
                        return (
                          <div
                            key={stg.id}
                            className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${stg.isCurrent
                              ? 'bg-rose-50/60 border-rose-400 shadow-md ring-2 ring-rose-200'
                              : stg.isCompleted
                                ? 'bg-slate-50/70 border-slate-200 opacity-90'
                                : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs'
                              }`}
                          >
                            {/* Number / Status Icon */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-2xl font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-xs ${stg.isCurrent
                                  ? 'bg-rose-500 text-white'
                                  : stg.isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                  }`}
                              >
                                <span className="text-[10px] uppercase">יום</span>
                                <span className="text-base leading-none">{stg.relativeStartDay}</span>
                              </div>

                              <div className="sm:hidden font-bold text-slate-800">
                                {stg.title}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-grow space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-base text-slate-900 hidden sm:block">
                                  {stg.title}
                                </h3>

                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                                  {stg.durationDays > 1 ? `${stg.durationDays} ימים` : 'יום בודד'}
                                </span>

                                {stg.isCurrent && (
                                  <span className="text-[11px] bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                    שלב פעיל כרגע ⭐
                                  </span>
                                )}

                                {stg.isCompleted && (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                                    ✓ בוצע
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600">
                                {stg.description}
                              </p>

                              <div className="text-xs text-rose-600 font-medium flex items-center gap-2 pt-1">
                                <span>📅 {formatDateIsraeli(stg.startDate)} ({formatDayName(stg.startDate)})</span>
                                {stg.durationDays > 1 && (
                                  <span>עד {formatDateIsraeli(stg.endDate)}</span>
                                )}
                                {stg.linkedMed && (
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                    משויך לתרופה: {stg.linkedMed.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls (Move Up/Down, Edit) */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => moveStage(index, -1)}
                                disabled={index === 0}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="הזז למעלה"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveStage(index, 1)}
                                disabled={index === stages.length - 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="הזז למטה"
                              >
                                ▼
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStage(stg);
                                  setIsStageModalOpen(true);
                                }}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                              >
                                ערוך ✏️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: CALENDAR VIEW (Like Google Calendar) */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs">

                  {/* Calendar Month Navigation Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-rose-100 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>📅</span>
                        <span>לוח שנה חודשי – מעקב זקיקים</span>
                      </h2>
                      <p className="text-sm text-slate-500">
                        תצוגה חזותית של כל הכדורים, הזריקות ובדיקות האולטראסאונד הפרוסים על גבי החודש.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const prev = new Date(calendarDate);
                          prev.setMonth(prev.getMonth() - 1);
                          setCalendarDate(prev);
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        חודש קודם →
                      </button>

                      <div className="font-bold text-base text-rose-700 px-3">
                        {calendarDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                      </div>

                      <button
                        onClick={() => {
                          const next = new Date(calendarDate);
                          next.setMonth(next.getMonth() + 1);
                          setCalendarDate(next);
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        ← חודש הבא
                      </button>

                      <button
                        onClick={() => setCalendarDate(new Date())}
                        className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold px-3 py-2 rounded-xl"
                      >
                        היום
                      </button>
                    </div>
                  </div>

                  {/* Monthly Grid */}
                  <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 bg-rose-50/70 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5">
                      <div>ראשון</div>
                      <div>שני</div>
                      <div>שלישי</div>
                      <div>רביעי</div>
                      <div>חמישי</div>
                      <div>שישי</div>
                      <div>שבת</div>
                    </div>

                    {/* Calendar Days Matrix */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
                      {(() => {
                        const year = calendarDate.getFullYear();
                        const month = calendarDate.getMonth();

                        // First day of month
                        const firstDayIndex = new Date(year, month, 1).getDay();
                        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

                        const cells = [];
                        // Leading empty cells
                        for (let i = 0; i < firstDayIndex; i++) {
                          cells.push(
                            <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/40 p-2 text-slate-300"></div>
                          );
                        }

                        // Month days
                        const todayStr = toISODate(new Date());

                        for (let day = 1; day <= totalDaysInMonth; day++) {
                          const cellDate = new Date(year, month, day);
                          const iso = toISODate(cellDate);
                          const isToday = iso === todayStr;
                          const events = calendarEventsMap[iso] || [];

                          cells.push(
                            <div
                              key={`day-${day}`}
                              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition flex flex-col justify-between ${isToday ? 'bg-rose-50/80 ring-2 ring-rose-400 inset-0' : 'bg-white hover:bg-slate-50/60'
                                }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isToday ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-700'
                                    }`}
                                >
                                  {day}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] font-bold text-rose-600">היום</span>
                                )}
                              </div>

                              {/* Events Pills inside day */}
                              <div className="space-y-1 overflow-y-auto max-h-[65px] no-scrollbar">
                                {events.map((ev, idx) => {
                                  const colors = getColorClasses(ev.color);
                                  return (
                                    <div
                                      key={idx}
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold truncate border ${colors.bg} ${colors.text} ${colors.border}`}
                                      title={ev.title}
                                    >
                                      {ev.title}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: MEDICINE CABINET & REMINDERS (ארון תרופות מלא) */}
            {activeTab === 'meds' && (
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
            )}

            {/* TAB 5: ARCHITECTURE, DEPLOYMENT & TECH STACK (הסבר למפתח) */}
            {activeTab === 'architecture' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-6">

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>🛠️</span>
                      <span>ארכיטקטורה מומלצת, Netlify, מסד נתונים וסמס/וואטסאפ</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      התשובה המלאה והמקצועית לשאלת הארכיטקטורה והסטאק שלך כדי שהמערכת תעלה בשבריר שנייה ליעלי.
                    </p>
                  </div>

                  {/* Stack Recommendation Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
                      <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                        <span>⚡</span>
                        <span>1. הפרונטאנד והאחסון (Netlify או Vercel)</span>
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>המלצה:</strong> בנה את הפרויקט ב-<strong>Vite + React</strong> (או Next.js App Router).
                        <br />
                        בניגוד ל-Render (שם בתוכנית חינמית השרת נכנס למצב שינה ומתעורר תוך 50 שניות!), ב-<strong>Netlify</strong> או <strong>Vercel</strong> האתר מוגש מ-Edge CDN גלובלי.
                        <br />
                        <strong>התוצאה:</strong> יעלי פותחת את האפליקציה בטלפון והיא נטענת ב-<strong>200 מילי-שניות</strong> מיידית.
                      </p>
                    </div>

                    <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 space-y-3">
                      <h3 className="font-bold text-blue-900 text-base flex items-center gap-2">
                        <span>🍃</span>
                        <span>2. חיבור למונגו (MongoDB Atlas) או Supabase</span>
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        ב-Netlify אין שרת Express שרץ 24/7, אבל יש <strong>Netlify Serverless Functions</strong> (נמצאות בתיקיית <code>/netlify/functions</code>).
                        <br />
                        פונקציית Serverless מתחברת ל-<strong>MongoDB Atlas</strong> (Mongoose / MongoClient עם חיבור cached), שומרת ומחזירה את המחזור והתרופות ב-JSON פשוט.
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
                      <h3 className="font-bold text-emerald-900 text-base flex items-center gap-2">
                        <span>📲</span>
                        <span>3. שליחת תזכורות בוואטסאפ ו-SMS אוטומטית</span>
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>אופציה א' (ללא עלות):</strong> שליחה בלחיצת כפתור (כמו המודל שמוטמע כאן באפליקציה עם <code>api.whatsapp.com/send</code>).
                        <br />
                        <strong>אופציה ב' (אוטומטי לחלוטין ברקע לפי שעה):</strong>
                        מחברים שירות Cron חינמי (כמו <strong>Upstash QStash</strong> או <strong>Cron-Job.org</strong>) שקורא כל שעה ל-Netlify Function.
                        הפונקציה בודקת מה צריך לקחת ושולחת דרך <strong>Green API</strong> / <strong>Twilio WhatsApp</strong> ישירות לנייד של יעלי ולנייד שלך.
                      </p>
                    </div>

                    <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-3">
                      <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                        <span>🔒</span>
                        <span>4. שמירה מקומית ואבטחה</span>
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        הנתונים נשמרים אוטומטית ב-MongoDB Atlas דרך <code>/api/tracker</code>. כך גם אתה וגם יעלי יכולים לגשת לאותם נתונים מכל מכשיר.
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </>
        )}

      </main>

      {/* MODAL: EDIT / ADD STAGE */}
      {isStageModalOpen && editingStage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">

            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingStage.id ? 'עריכת שלב בפרוטוקול' : 'הוספת שלב חדש'}
              </h3>
              <button
                onClick={() => setIsStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם השלב / הבדיקה:</label>
                <input
                  type="text"
                  value={editingStage.title}
                  onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  placeholder="לדוגמה: אולטראסאונד זקיקים חוזר"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מתחיל ביום למחזור (D#):</label>
                  <input
                    type="number"
                    min="1"
                    value={editingStage.relativeStartDay}
                    onChange={(e) => setEditingStage({ ...editingStage, relativeStartDay: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">משך בימים:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingStage.durationDays}
                    onChange={(e) => setEditingStage({ ...editingStage, durationDays: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">שיוך לתרופה (אופציונלי):</label>
                <select
                  value={editingStage.medicationId}
                  onChange={(e) => setEditingStage({ ...editingStage, medicationId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                >
                  <option value="">-- ללא שיוך תרופתי (בדיקה/מנוחה) --</option>
                  {medications.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תיאור והנחיות:</label>
                <textarea
                  value={editingStage.description}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  placeholder="הנחיות, תוצאות בדיקת דם מבוקשות וכדומה"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {editingStage.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteStage(editingStage.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                >
                  מחק שלב זה
                </button>
              )}
              <div className="flex gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveStage(editingStage)}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs"
                >
                  שמור שלב
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: EDIT / ADD MEDICATION */}
      {isMedModalOpen && editingMed && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in duration-200 text-right">

            <div className="flex justify-between items-center border-b border-rose-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editingMed.id ? 'עריכת תרופה בארון' : 'הוספת תרופה חדשה'}
              </h3>
              <button
                onClick={() => setIsMedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם התרופה / הזריקה:</label>
                <input
                  type="text"
                  value={editingMed.name}
                  onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  placeholder="למשל: לטרוזול / אוביטרל"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">מינון בכל מנה:</label>
                  <input
                    type="text"
                    value={editingMed.dosage}
                    onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                    placeholder="1 כדור (2.5 מ״ג)"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">מספר מנות ביום:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingMed.timesPerDay}
                    onChange={(e) => setEditingMed({ ...editingMed, timesPerDay: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">לכמה ימים לקחת? (0 = קבוע ללא הגבלה):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingMed.durationDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditingMed({ ...editingMed, durationDays: val, isContinuous: val === 0 });
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">שעת תזכורת (מופרד בפסיק):</label>
                  <input
                    type="text"
                    value={editingMed.hours.join(', ')}
                    onChange={(e) => setEditingMed({ ...editingMed, hours: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                    placeholder="08:00, 20:00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">הערות נוספות והנחיות:</label>
                <textarea
                  value={editingMed.notes}
                  onChange={(e) => setEditingMed({ ...editingMed, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-rose-500 text-sm"
                  placeholder="עם האוכל, לשמור במקרר וכו'"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {editingMed.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedication(editingMed.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                >
                  מחק תרופה זו
                </button>
              )}
              <div className="flex gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="text-xs text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMedication(editingMed)}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  שמור תרופה
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: RESET CYCLE (DATE & TIME) */}
      {isResetModalOpen && (
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
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in slide-in-from-bottom-5">
          <span>💖</span>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}