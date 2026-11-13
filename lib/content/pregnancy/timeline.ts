import type { TrimesterInfo } from './types';

/**
 * Trimester boundaries follow the NHS week-by-week guide
 * (1st: up to week 12, 2nd: weeks 13–27, 3rd: week 28 to birth).
 * Note: other bodies (e.g. ACOG, via secondary sources) start the 2nd trimester at 14+0 — see SOURCES.md.
 * Weeks are counted from the first day of the last menstrual period.
 */
export const TRIMESTERS: TrimesterInfo[] = [
  {
    trimester: 1,
    title: 'השליש הראשון',
    fromWeek: 0,
    toWeek: 12,
    weeksLabel: 'עד סוף שבוע 12',
    summary:
      'התקופה שבה נבנים היסודות: מערכת העצבים, הלב והאיברים מתחילים להיווצר, ובסופה העובר כבר נראה כמו תינוק קטנטן. עייפות ובחילות נפוצות מאוד בשלב הזה, ובשבועות האלה מתבצעים האולטרסאונד הראשון, בדיקות הדם הראשונות ושקיפות העורף.',
    sources: ['nhs-week-by-week', 'nhs-week-4', 'nhs-week-12', 'moh-tests'],
  },
  {
    trimester: 2,
    title: 'השליש השני',
    fromWeek: 13,
    toWeek: 27,
    weeksLabel: 'שבועות 13–27',
    summary:
      'אצל רבות הבחילות נרגעות והאנרגיה חוזרת. הבטן מתחילה להיראות, ובין שבוע 16 ל-24 מתחילים בדרך כלל להרגיש תנועות. זה הזמן של סקירות המערכות, התבחין המשולש והעמסת הסוכר.',
    sources: ['nhs-week-by-week', 'nhs-week-13', 'nhs-movements', 'moh-tests'],
  },
  {
    trimester: 3,
    title: 'השליש השלישי',
    fromWeek: 28,
    toWeek: 42,
    weeksLabel: 'משבוע 28 ועד הלידה',
    summary:
      'התינוק גדל, צובר שומן והאיברים שלו מבשילים. ייתכנו צרבת, נפיחות, קוצר נשימה וקשיי שינה. חשוב להכיר את דפוס התנועות של התינוק ולפנות מיד אם הוא משתנה. משבוע 37 התינוק נחשב בשל (Full term).',
    sources: ['nhs-week-by-week', 'nhs-week-28', 'nhs-week-37', 'nhs-movements', 'moh-tests'],
  },
];

export const COUNTING_NOTE =
  'ספירת שבועות ההריון מתחילה מהיום הראשון של הווסת האחרונה, ותאריך הלידה המשוער הוא 40 שבועות (280 יום) לאחר מכן. רוב הלידות מתרחשות בטווח של כשבוע לפני או אחרי התאריך המשוער.';
