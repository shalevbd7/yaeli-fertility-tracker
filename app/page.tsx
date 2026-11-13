"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ymdInIsrael } from '@/lib/israel-date';
import { toISODate } from '@/lib/tracker/dates';
import { buildCalendarEvents, computeCycleMetrics, resolveStages } from '@/lib/tracker/schedule';
import type { Medication, Stage } from '@/lib/tracker/types';
import { useToast } from '@/hooks/useToast';
import { useTrackerData } from '@/hooks/useTrackerData';
import AppHeader from '@/components/tracker/AppHeader';
import AffirmationBanner from '@/components/tracker/AffirmationBanner';
import DashboardTab from '@/components/tracker/DashboardTab';
import TimelineTab from '@/components/tracker/TimelineTab';
import CalendarTab from '@/components/tracker/CalendarTab';
import MedsTab from '@/components/tracker/MedsTab';
import ArchitectureTab from '@/components/tracker/ArchitectureTab';
import StageModal from '@/components/tracker/StageModal';
import MedicationModal from '@/components/tracker/MedicationModal';
import ResetCycleModal from '@/components/tracker/ResetCycleModal';
import ToastNotification from '@/components/tracker/ToastNotification';
import SettingsTab from '@/components/settings/SettingsTab';
import AccessStatusScreen from '@/components/settings/AccessStatusScreen';
import { useAccount } from '@/hooks/useAccount';
import { FERTILITY_TABS, SETTINGS_TAB } from '@/lib/tracker/tabs';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | timeline | calendar | meds | architecture

  // Toast Notification System
  const { toast, showToast } = useToast();

  // Tracker data (cycle, stages, medications, completed tasks) + cloud sync
  const {
    hasCycle, setHasCycle,
    cycleStartDate, setCycleStartDate,
    medications, setMedications,
    stages, setStages,
    completedItems, setCompletedItems,
    isLoading, isSaving, loadError, saveError, noAccess,
    reload,
    markDeliberateClear,
  } = useTrackerData(showToast);

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

  const cycleMetrics = useMemo(
    () => computeCycleMetrics(hasCycle, cycleStartDate, stages),
    [hasCycle, cycleStartDate, stages]
  );

  const todayYmdIsrael = ymdInIsrael();

  // Account / role (polled for the pending-requests badge and approval)
  const { account, accountError, refreshAccount } = useAccount();
  const role = account?.role;
  const hasTrackerAccess = !noAccess && role !== 'pending' && role !== 'none';

  // A waiting partner was approved → load the shared tracker.
  useEffect(() => {
    if (noAccess && (role === 'owner' || role === 'partner')) reload();
  }, [noAccess, role, reload]);

  const tabs = [...FERTILITY_TABS, SETTINGS_TAB];
  const badges = { settings: role === 'owner' ? (account?.pendingRequests.length ?? 0) : 0 };

  const resolvedStages = useMemo(
    () => resolveStages(stages, cycleStartDate, medications),
    [stages, cycleStartDate, medications]
  );

  const calendarEventsMap = useMemo(
    () => buildCalendarEvents(resolvedStages, hasCycle, medications),
    [resolvedStages, hasCycle, medications]
  );

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
      const result = await res.json().catch(() => ({}));
      if (result?.skipped) {
        // Test account or TELEGRAM_DRY_RUN: nothing was sent to the real chat.
        showToast('מצב בדיקה – התזכורת לא נשלחה לטלגרם', 'error');
        return;
      }
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
    const remaining = stages.filter(s => s.id !== id);
    // Deliberately deleting the last stage may empty the tracker — allow that save.
    if (remaining.length === 0) markDeliberateClear();
    setStages(remaining);
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
    const remaining = medications.filter(m => m.id !== id);
    // Deliberately deleting the last medication may empty the tracker — allow that save.
    if (remaining.length === 0) markDeliberateClear();
    setMedications(remaining);
    setIsMedModalOpen(false);
    showToast('התרופה הוסרה');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-800 font-sans antialiased pb-16" dir="rtl">

      {/* Top Loving Header Bar */}
      <AppHeader
        tabs={tabs}
        badges={badges}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasCycle={hasCycle}
        isLoading={isLoading}
        isSaving={isSaving}
        saveError={saveError}
        cycleMetrics={cycleMetrics}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl p-4 flex items-center justify-between gap-4">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={reload}
              className="text-xs bg-white text-amber-800 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition shrink-0"
            >
              נסי שוב
            </button>
          </div>
        )}

        {!hasTrackerAccess ? (
          <AccessStatusScreen role={role} />
        ) : isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">טוענים את הנתונים שלך מהענן...</p>
          </div>
        ) : (
          <>

            {/* Loving Quote Banner */}
            <AffirmationBanner quoteIndex={quoteIndex} setQuoteIndex={setQuoteIndex} />

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                setActiveTab={setActiveTab}
                hasCycle={hasCycle}
                setHasCycle={setHasCycle}
                cycleStartDate={cycleStartDate}
                medications={medications}
                completedItems={completedItems}
                setCompletedItems={setCompletedItems}
                sendingMedId={sendingMedId}
                setIsResetModalOpen={setIsResetModalOpen}
                resetDate={resetDate}
                setResetDate={setResetDate}
                resetTime={resetTime}
                setResetTime={setResetTime}
                showToast={showToast}
                cycleMetrics={cycleMetrics}
                todayYmdIsrael={todayYmdIsrael}
                resolvedStages={resolvedStages}
                sendTelegramReminder={sendTelegramReminder}
                handleConfirmReset={handleConfirmReset}
              />
            )}

            {/* TAB 2: TIMELINE & STAGE MANAGER (Drag / Reorder / Customize) */}
            {activeTab === 'timeline' && (
              <TimelineTab
                cycleStartDate={cycleStartDate}
                stages={stages}
                setEditingStage={setEditingStage}
                setIsStageModalOpen={setIsStageModalOpen}
                resolvedStages={resolvedStages}
                moveStage={moveStage}
              />
            )}

            {/* TAB 3: CALENDAR VIEW (Like Google Calendar) */}
            {activeTab === 'calendar' && (
              <CalendarTab
                calendarDate={calendarDate}
                setCalendarDate={setCalendarDate}
                calendarEventsMap={calendarEventsMap}
              />
            )}

            {/* TAB 4: MEDICINE CABINET & REMINDERS (ארון תרופות מלא) */}
            {activeTab === 'meds' && (
              <MedsTab
                medications={medications}
                sendingMedId={sendingMedId}
                setEditingMed={setEditingMed}
                setIsMedModalOpen={setIsMedModalOpen}
                sendTelegramReminder={sendTelegramReminder}
              />
            )}

            {/* TAB 5: ARCHITECTURE, DEPLOYMENT & TECH STACK (הסבר למפתח) */}
            {activeTab === 'architecture' && <ArchitectureTab />}

            {/* SETTINGS (partner linking; owner-only sections inside) */}
            {activeTab === 'settings' && (
              <SettingsTab
                account={account}
                accountError={accountError}
                refreshAccount={refreshAccount}
                showToast={showToast}
              />
            )}

          </>
        )}

      </main>

      {/* MODAL: EDIT / ADD STAGE */}
      {isStageModalOpen && editingStage && (
        <StageModal
          medications={medications}
          editingStage={editingStage}
          setEditingStage={setEditingStage}
          setIsStageModalOpen={setIsStageModalOpen}
          handleSaveStage={handleSaveStage}
          handleDeleteStage={handleDeleteStage}
        />
      )}

      {/* MODAL: EDIT / ADD MEDICATION */}
      {isMedModalOpen && editingMed && (
        <MedicationModal
          editingMed={editingMed}
          setEditingMed={setEditingMed}
          setIsMedModalOpen={setIsMedModalOpen}
          handleSaveMedication={handleSaveMedication}
          handleDeleteMedication={handleDeleteMedication}
        />
      )}

      {/* MODAL: RESET CYCLE (DATE & TIME) */}
      {isResetModalOpen && (
        <ResetCycleModal
          setIsResetModalOpen={setIsResetModalOpen}
          resetDate={resetDate}
          setResetDate={setResetDate}
          resetTime={resetTime}
          setResetTime={setResetTime}
          handleConfirmReset={handleConfirmReset}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {toast && <ToastNotification toast={toast} />}

    </div>
  );
}
