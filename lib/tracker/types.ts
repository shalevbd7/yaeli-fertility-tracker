export type Medication = {
  id: string;
  name: string;
  dosage: string;
  timesPerDay: number;
  hours: string[];
  durationDays: number;
  isContinuous: boolean;
  notes: string;
  color: string;
  // Added for pregnancy medications (optional; fertility medications never
  // set them and keep behaving exactly as before).
  /** Missing = 'daily'. */
  schedule?: 'daily' | 'weekly' | 'asNeeded';
  /** For 'weekly': 0 = Sunday … 6 = Saturday. */
  weekdays?: number[];
};

export type Stage = {
  id: string;
  title: string;
  relativeStartDay: number;
  durationDays: number;
  type: string;
  description: string;
  medicationId: string;
  color: string;
};

export type ResolvedStage = Stage & {
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  linkedMed?: Medication;
};

export type Toast = { message: string; type?: string } | null;

export type TrackerMode = 'fertility' | 'pregnancy';

export type PregnancyTest = {
  id: string;
  /** Key of a standard test from lib/content/pregnancy/tests (empty for custom tests). */
  standardKey: string;
  name: string;
  /** YYYY-MM-DD or '' when not scheduled yet. */
  date: string;
  location: string;
  done: boolean;
  notes: string;
};

export type SymptomLogEntry = {
  id: string;
  /** Key from lib/content/pregnancy/symptoms, or 'other'. */
  symptomKey: string;
  /** YYYY-MM-DD */
  date: string;
  note: string;
};

export type AsNeededLogEntry = {
  id: string;
  medId: string;
  /** ISO timestamp */
  at: string;
};

/** Pregnancy data that both the owner and the partner can edit (autosaved). */
export type PregnancyEditable = {
  tests: PregnancyTest[];
  symptomLog: SymptomLogEntry[];
  medications: Medication[];
  /** `${medId}@${HH:MM}` → YYYY-MM-DD the dose was last taken. */
  doseLog: Record<string, string>;
  asNeededLog: AsNeededLogEntry[];
};

export type PregnancyData = PregnancyEditable & {
  /** Anchor: first day of the last menstrual period (YYYY-MM-DD). Owner-only. */
  lmpDate: string;
  startedAt: string | null;
};

export type TrackerPayload = {
  hasActiveCycle: boolean;
  cycleStartDate: string | null;
  stages: Stage[];
  medications: Medication[];
  completedTasks: Record<string, string>;
  /** Sent only when the tracker has pregnancy data. */
  pregnancy?: PregnancyEditable;
};

export type CycleMetrics = {
  cycleDay: number;
  currentStage: Stage | null;
  isBefore?: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  color: string;
  med?: Medication;
};

export type TabId = string; // dashboard | timeline | calendar | meds | architecture
