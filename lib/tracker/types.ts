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

export type TrackerPayload = {
  hasActiveCycle: boolean;
  cycleStartDate: string | null;
  stages: Stage[];
  medications: Medication[];
  completedTasks: Record<string, string>;
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
