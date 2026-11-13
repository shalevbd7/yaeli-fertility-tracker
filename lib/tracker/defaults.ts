import type { Medication, Stage } from './types';

export const LOVING_AFFIRMATIONS = [
  "אהבת חיי שלי, אני גאה בך ברמות שאת מקפידה ומצליחה",
  "את גיבורה וחזקה. אני איתך בכל שנייה, בכל תרופה ובכל בדיקה 💕",
  "תמשיכי ככה אהובתי. אני כאן תמיד",
  "את השראה בשבילי",
  "אני הכי מאושר בעולם שאנחנו עוברים את המסע ביחד",
  "תאמיני בו, זה יבוא ברגע הנכון בזמן הנכון 💕"
];

// Preloaded standard fertility meds
export const INITIAL_MEDICATIONS: Medication[] = [
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
export const DEFAULT_STAGES: Stage[] = [
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
