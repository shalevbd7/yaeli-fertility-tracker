import { isValidYmd } from '@/lib/israel-date';
import { normalizeTimes } from './doses';
import type {
  AsNeededLogEntry,
  Medication,
  PregnancyEditable,
  PregnancyTest,
  SymptomLogEntry,
} from '@/lib/tracker/types';

/** Server-side cleanup of the pregnancy part of a save request. */
const MAX_SYMPTOM_LOG = 1000;
const MAX_AS_NEEDED_LOG = 500;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DOSE_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}@([01]\d|2[0-3]):[0-5]\d$/;

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

function validId(v: unknown): v is string {
  return typeof v === 'string' && ID_PATTERN.test(v);
}

function sanitizeTest(raw: unknown): PregnancyTest | null {
  const t = obj(raw);
  if (!validId(t.id)) return null;
  return {
    id: t.id,
    standardKey: str(t.standardKey, 64),
    name: str(t.name, 120),
    date: isValidYmd(t.date) ? t.date : '',
    location: str(t.location, 200),
    done: t.done === true,
    notes: str(t.notes, 1000),
  };
}

function sanitizeSymptom(raw: unknown): SymptomLogEntry | null {
  const s = obj(raw);
  if (!validId(s.id) || !isValidYmd(s.date)) return null;
  return { id: s.id, symptomKey: str(s.symptomKey, 64) || 'other', date: s.date, note: str(s.note, 1000) };
}

function sanitizeMedication(raw: unknown): Medication | null {
  const m = obj(raw);
  if (!validId(m.id)) return null;
  const hours = normalizeTimes(arr(m.hours));
  const schedule = m.schedule === 'weekly' || m.schedule === 'asNeeded' ? m.schedule : 'daily';
  const weekdays = Array.from(
    new Set(arr(m.weekdays).filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))
  ).sort();
  return {
    id: m.id,
    name: str(m.name, 120),
    dosage: str(m.dosage, 120),
    timesPerDay: hours.length,
    hours,
    durationDays: 0,
    isContinuous: true,
    notes: str(m.notes, 1000),
    color: str(m.color, 20) || 'rose',
    schedule,
    weekdays: schedule === 'weekly' ? weekdays : [],
  };
}

function sanitizeAsNeeded(raw: unknown): AsNeededLogEntry | null {
  const e = obj(raw);
  const at = typeof e.at === 'string' ? new Date(e.at) : null;
  if (!validId(e.id) || !validId(e.medId) || !at || isNaN(at.getTime())) return null;
  return { id: e.id, medId: e.medId, at: at.toISOString() };
}

const notNull = <T,>(v: T | null): v is T => v !== null;

export function sanitizePregnancyEditable(raw: unknown): PregnancyEditable {
  const p = obj(raw);
  const doseLog: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj(p.doseLog))) {
    if (DOSE_KEY_PATTERN.test(key) && isValidYmd(value)) doseLog[key] = value;
  }
  return {
    tests: arr(p.tests).map(sanitizeTest).filter(notNull),
    symptomLog: arr(p.symptomLog).map(sanitizeSymptom).filter(notNull).slice(-MAX_SYMPTOM_LOG),
    medications: arr(p.medications).map(sanitizeMedication).filter(notNull),
    doseLog,
    asNeededLog: arr(p.asNeededLog).map(sanitizeAsNeeded).filter(notNull).slice(-MAX_AS_NEEDED_LOG),
  };
}
