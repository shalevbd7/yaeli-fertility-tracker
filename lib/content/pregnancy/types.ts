import type { Trimester } from '@/lib/pregnancy/dates';

/** Every content item lists the ids of the sources it is based on (see sources.ts / SOURCES.md). */
export type SourceId = string;

export type TrimesterInfo = {
  trimester: Trimester;
  title: string;
  /** Inclusive range of completed weeks, e.g. 0–12. */
  fromWeek: number;
  toWeek: number;
  weeksLabel: string;
  summary: string;
  sources: SourceId[];
};

export type WeekInfo = {
  /** Completed weeks (the "12" in 12+3). */
  week: number;
  /** Approximate size, only where the source states it. */
  size?: string;
  baby: string;
  you: string;
  /** Optional practical note for this week (tests, things to know). */
  note?: string;
  sources: SourceId[];
};

export type TestKind = 'routine' | 'conditional' | 'optional';

export type StandardTest = {
  key: string;
  name: string;
  /** Recommended window in completed weeks (inclusive). */
  fromWeek: number;
  toWeek: number;
  /** How the window is described to the user (the source's wording, in Hebrew). */
  windowLabel: string;
  kind: TestKind;
  /** Who it's for, when not everyone. */
  audience?: string;
  description: string;
  /** Coverage / where-it's-done notes and timing differences between sources. */
  notes?: string;
  sources: SourceId[];
};

export type Symptom = {
  key: string;
  name: string;
  icon: string;
  trimesters: Trimester[];
  /** When it typically appears, if the source says. */
  timing?: string;
  summary: string;
  tips: string[];
  whenToCall: string;
  sources: SourceId[];
};

export type WarningSign = {
  text: string;
  /** 'now' = seek care immediately; 'soon' = contact your doctor/midwife the same day. */
  urgency: 'now' | 'soon';
  sources: SourceId[];
};
