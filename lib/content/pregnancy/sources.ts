/**
 * Sources used for the pregnancy content (accessed 2026-11-13).
 * Full list with what came from each: lib/content/pregnancy/SOURCES.md
 */
export type Source = { title: string; url: string };

const NHS_WEEK = (trimester: 1 | 2 | 3, week: number): Source => ({
  title: `NHS – Week-by-week guide to pregnancy, week ${week}`,
  url: `https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/${trimester === 1 ? '1st' : trimester === 2 ? '2nd' : '3rd'}-trimester/week-${week}/`,
});

const nhsWeekTrimester = (week: number): 1 | 2 | 3 => (week <= 12 ? 1 : week <= 27 ? 2 : 3);

export const SOURCES: Record<string, Source> = {
  'moh-tests': {
    title: 'משרד הבריאות – בדיקות מומלצות בהריון',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/screening/',
  },
  'moh-genetic': {
    title: 'משרד הבריאות – בדיקות סקר גנטיות',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/before-pregnancy-tests/genetic-screening/',
  },
  'moh-nt': {
    title: 'משרד הבריאות – שקיפות עורפית',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/nt/',
  },
  'moh-anatomy': {
    title: 'משרד הבריאות – סקירת מערכות',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/anatomy-scan/',
  },
  'moh-down-screening': {
    title: 'משרד הבריאות – בדיקות סקר לגילוי תסמונת דאון',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/screening-test/',
  },
  'moh-nipt': {
    title: 'משרד הבריאות – בדיקת NIPT/NIPS',
    url: 'https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/nipt-nips/',
  },
  leumit: {
    title: 'לאומית – הבדיקות המומלצות במהלך ההריון',
    url: 'https://www.leumit.co.il/pregnancy/during-your-pregnancy/the-tests-are-recommended-during-pregnancy/',
  },
  maccabi: {
    title: 'מכבי – בדיקות בהריון: טרימסטר ראשון, שני ושלישי',
    url: 'https://www.maccabi4u.co.il/maccabi_circles/pregnancy-and-birth/pregnancy_birth/tests/',
  },
  kolzchut: {
    title: 'כל זכות – בדיקות במהלך ההריון',
    url: 'https://www.kolzchut.org.il/he/בדיקות_במהלך_ההריון',
  },
  midaat: {
    title: 'מדעת – מעקב הריון',
    url: 'https://www.midaat.org.il/articles/health-and-sickness/pregnancy-follow-up/',
  },
  'nhs-week-by-week': { title: 'NHS – Pregnancy week by week', url: 'https://www.nhs.uk/pregnancy/week-by-week/' },
  'nhs-get-help': {
    title: 'NHS – Pregnancy symptoms you need to get help for',
    url: 'https://www.nhs.uk/pregnancy/common-symptoms/pregnancy-symptoms-you-need-to-get-help-for/',
  },
  'nhs-common': {
    title: 'NHS – Common symptoms in pregnancy',
    url: 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/',
  },
  'nhs-sickness': { title: 'NHS – Vomiting and morning sickness', url: 'https://www.nhs.uk/pregnancy/common-symptoms/vomiting-and-morning-sickness/' },
  'nhs-tiredness': { title: 'NHS – Tiredness', url: 'https://www.nhs.uk/pregnancy/common-symptoms/tiredness/' },
  'nhs-heartburn': { title: 'NHS – Indigestion and heartburn', url: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/' },
  'nhs-health-problems': { title: 'NHS – Common health problems in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/common-health-problems/' },
  'nhs-back-pain': { title: 'NHS – Back pain', url: 'https://www.nhs.uk/pregnancy/common-symptoms/back-pain/' },
  'nhs-swelling': { title: 'NHS – Swollen ankles, feet and fingers', url: 'https://www.nhs.uk/pregnancy/common-symptoms/swollen-ankles-feet-and-fingers/' },
  'nhs-headaches': { title: 'NHS – Headaches', url: 'https://www.nhs.uk/pregnancy/common-symptoms/headaches/' },
  'nhs-pelvic-pain': { title: 'NHS – Pelvic pain', url: 'https://www.nhs.uk/pregnancy/common-symptoms/pelvic-pain/' },
  'nhs-itching': { title: 'NHS – Itching and intrahepatic cholestasis', url: 'https://www.nhs.uk/pregnancy/complications/itching-and-intrahepatic-cholestasis/' },
  'nhs-breathless': { title: 'NHS – Shortness of breath', url: 'https://www.nhs.uk/symptoms/shortness-of-breath/' },
  'nhs-discharge': { title: 'NHS – Vaginal discharge', url: 'https://www.nhs.uk/pregnancy/common-symptoms/vaginal-discharge/' },
  'nhs-piles': { title: 'NHS – Piles', url: 'https://www.nhs.uk/pregnancy/common-symptoms/piles/' },
  'nhs-stomach-pain': { title: 'NHS – Stomach pain', url: 'https://www.nhs.uk/pregnancy/common-symptoms/stomach-pain/' },
  'nhs-bleeding': { title: 'NHS – Vaginal bleeding', url: 'https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/' },
  'nhs-movements': { title: "NHS – Your baby's movements", url: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/' },
  'nhs-pre-eclampsia': { title: 'NHS – Pre-eclampsia', url: 'https://www.nhs.uk/conditions/pre-eclampsia/' },
  ...Object.fromEntries(
    Array.from({ length: 38 }, (_, i) => i + 4).map((w) => [`nhs-week-${w}`, NHS_WEEK(nhsWeekTrimester(w), w)])
  ),
};

/** Sources the UI credits under the general-information note. */
export const CREDITED_SOURCES = ['משרד הבריאות', 'קופות החולים (לאומית, מכבי)', 'כל זכות', 'מדעת', 'NHS (שירות הבריאות הבריטי)'];
