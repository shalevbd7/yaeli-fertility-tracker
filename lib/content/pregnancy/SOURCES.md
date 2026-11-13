# Pregnancy content: sources

All sources were accessed on **2026-11-13** using automated web fetches. The content in this folder is written in Hebrew, in our own words (no copied text), and is presented in the app as general information that does not replace medical advice.

Each item in `timeline.ts`, `weeks.ts`, `tests.ts` and `symptoms.ts` has a `sources` array. The ids in it are defined in `sources.ts` and listed below. `content.test.ts` checks that every item cites at least one known source.

How conflicts were resolved: for test timing, the **Israeli Ministry of Health** table takes priority. Where a health fund or another source gives a different range, the item's `notes` field says so.

---

## 1. Israeli Ministry of Health (me.health.gov.il): primary source for tests

| id | Title | URL | What came from it |
|---|---|---|---|
| `moh-tests` | בדיקות מומלצות בהריון (page updated 6 May 2024) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/screening/ | The main list of tests and their windows: first visit 6–9; dating ultrasound 6–12; first blood and urine tests until 12; serology from 9; NT and first-trimester screen 11–13; early anatomy scan 12–16; triple screen 16–19; amniocentesis 16–22; CVS 11–13; late anatomy scan 20–24; glucose challenge, blood count, urine culture and Rh antibodies 24–28; growth ultrasound from 27; optional third scan 30–32; GBS 36–37; post-due-date monitoring every 2–3 days. Also basket coverage, eligibility for amniocentesis and CVS ("לפי המלצה רפואית, או מגיל 32"), and Rh antibodies only for Rh-negative women. |
| `moh-genetic` | בדיקות סקר גנטיות (updated 17 Nov 2024) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/before-pregnancy-tests/genetic-screening/ | Carrier screening before or early in pregnancy, free in the health basket, to be updated before each pregnancy, and the uniform panel from 15 Nov 2024. |
| `moh-nt` | שקיפות עורפית (updated 29 Apr 2026) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/nt/ | NT window 11–13, purpose, basket with co-payment, and that the fluid is absorbed after this window. |
| `moh-anatomy` | סקירת מערכות (updated 29 Jun 2026) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/anatomy-scan/ | Early scan 12–16, late scan 20–24 (recommended 20–23), third scan 30–32 as needed. |
| `moh-down-screening` | בדיקות סקר לגילוי תסמונת דאון (updated 29 Apr 2026) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/screening-test/ | First-trimester combined screen. Early anatomy scan 14–16 (this page) vs 12–16 (main table). Triple screen 16–20 (this page) vs 16–19 (main table), and its combination with first-trimester results. |
| `moh-nipt` | בדיקת NIPT/NIPS (updated 29 Apr 2026) | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/tests-during/nipt-nips/ | From week 10, screening not diagnostic, not in the basket, results in 10–14 days. |

## 2. Israeli health funds and information sites: secondary sources for tests

| id | Title | URL | What came from it |
|---|---|---|---|
| `leumit` | לאומית – הבדיקות המומלצות במהלך ההריון | https://www.leumit.co.il/pregnancy/during-your-pregnancy/the-tests-are-recommended-during-pregnancy/ | Alternative windows, noted in `notes`: dating US 6–10, NT 11–14, early scan 14–16, triple 16–20, late scan 19–25 (recommended 21–24), glucose 24–26, Rh antibodies 26–28, GBS 35–37 by doctor's decision, growth US 32–34. **Anti-D at week 28.** **Pertussis vaccine at 27–36.** Monthly nurse check-ups (blood pressure, weight, urine). |
| `maccabi` | מכבי – בדיקות בהריון | https://www.maccabi4u.co.il/maccabi_circles/pregnancy-and-birth/pregnancy_birth/tests/ | Alternative windows: young-pregnancy US 6–7, early scan 14–16, triple 16–19, late scan 21–24, amniocentesis 16–20. |
| `kolzchut` | כל זכות – בדיקות במהלך ההריון (revision of 19 Mar 2025) | https://www.kolzchut.org.il/he/בדיקות_במהלך_ההריון | Basket coverage, and amniocentesis and CVS eligibility from age 32. It gives no timing. |
| `midaat` | מדעת – מעקב הריון | https://www.midaat.org.il/articles/health-and-sickness/pregnancy-follow-up/ | Anti-D at 28 for Rh-negative women, pertussis vaccine 27–36, follow-up about every 4 weeks, amniocentesis age 35 (conflicts with the Ministry of Health's 32; noted in the app). |

## 3. NHS (nhs.uk): week-by-week content, trimesters, symptoms and warning signs

| id | Title | URL | What came from it |
|---|---|---|---|
| `nhs-week-by-week` | Pregnancy week by week | https://www.nhs.uk/pregnancy/week-by-week/ | **Trimester boundaries used in the app: 1st = weeks 4–12, 2nd = 13–27, 3rd = 28–41.** |
| `nhs-week-4` … `nhs-week-41` | Week-by-week guide, one page per week | https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/{1st,2nd,3rd}-trimester/week-N/ | Every entry in `weeks.ts`: the baby's development, the approximate size, what she may notice, dating from the first day of the last period, full term from week 37, and the post-term discussion at 41. All 38 weekly pages (4–41) were read. |
| `nhs-get-help` | Pregnancy symptoms you need to get help for | https://www.nhs.uk/pregnancy/common-symptoms/pregnancy-symptoms-you-need-to-get-help-for/ | Warning signs list |
| `nhs-common` | Common symptoms in pregnancy (hub) | https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/ | Which symptoms to cover |
| `nhs-sickness` | Vomiting and morning sickness | https://www.nhs.uk/pregnancy/common-symptoms/vomiting-and-morning-sickness/ | Nausea |
| `nhs-tiredness` | Tiredness | https://www.nhs.uk/pregnancy/common-symptoms/tiredness/ | Tiredness, sleep problems, sleeping on the side after 28 weeks |
| `nhs-heartburn` | Indigestion and heartburn | https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/ | Heartburn |
| `nhs-health-problems` | Common health problems in pregnancy | https://www.nhs.uk/pregnancy/common-symptoms/common-health-problems/ | Constipation, cramps, feeling faint or hot, frequent urination, varicose veins |
| `nhs-back-pain` | Back pain | https://www.nhs.uk/pregnancy/common-symptoms/back-pain/ | Back pain |
| `nhs-swelling` | Swollen ankles, feet and fingers | https://www.nhs.uk/pregnancy/common-symptoms/swollen-ankles-feet-and-fingers/ | Swelling |
| `nhs-headaches` | Headaches | https://www.nhs.uk/pregnancy/common-symptoms/headaches/ | Headaches |
| `nhs-pelvic-pain` | Pelvic pain | https://www.nhs.uk/pregnancy/common-symptoms/pelvic-pain/ | Pelvic pain |
| `nhs-itching` | Itching and intrahepatic cholestasis | https://www.nhs.uk/pregnancy/complications/itching-and-intrahepatic-cholestasis/ | Itching |
| `nhs-breathless` | Shortness of breath (general NHS page) | https://www.nhs.uk/symptoms/shortness-of-breath/ | Emergency criteria for breathlessness, and pain or swelling in one leg |
| `nhs-discharge` | Vaginal discharge | https://www.nhs.uk/pregnancy/common-symptoms/vaginal-discharge/ | Discharge |
| `nhs-piles` | Piles | https://www.nhs.uk/pregnancy/common-symptoms/piles/ | Piles |
| `nhs-stomach-pain` | Stomach pain | https://www.nhs.uk/pregnancy/common-symptoms/stomach-pain/ | Stomach and ligament pain, regular tightenings |
| `nhs-bleeding` | Vaginal bleeding | https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/ | Bleeding warning signs |
| `nhs-movements` | Your baby's movements | https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/ | Movements usually start at 16–24 weeks; if they change, call immediately, even at night |
| `nhs-pre-eclampsia` | Pre-eclampsia (reviewed 23 Mar 2026) | https://www.nhs.uk/conditions/pre-eclampsia/ | Pre-eclampsia symptoms, usually from week 20 |

---

## Sources that could not be opened

| Source | URL | Problem | What was used instead |
|---|---|---|---|
| ACOG – How Your Fetus Grows During Pregnancy | https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy | HTTP 402 (blocks automated access) | The NHS week-by-week guide. ACOG's trimester definition (2nd trimester from 14+0, 3rd from 28+0) was seen only in **secondary** search results, so it was **not used**. The app uses the NHS boundaries (13 / 28). Please check ACOG in a browser if you prefer its boundaries. |
| ACOG infographics | https://www.acog.org/womens-health/infographics | HTTP 402 | As above |
| Ministry of Health – pregnancy-monitoring index page | https://me.health.gov.il/parenting/family-planning/pregnancy-monitoring/ | The page returned an error ("הפעולה אותה ביצעת אינה נתמכת") | The test subpages listed above, which did load |
| WHO – Antenatal care recommendations (2016) | https://www.who.int/publications/i/item/9789241549912 | Only the landing page loaded; the PDF was not read | Not used |
| MedlinePlus | https://medlineplus.gov/ency/article/002004.htm | Wrong page (newborn development) | Not used |

No Israeli source that was read defines the trimester boundaries in weeks. Maccabi's page groups tests by trimester but gives no boundaries.

---

## Not verified: content not taken from the sources above

- **"מד״א 101" and "מיון יולדות"** in `WHERE_TO_TURN` (`symptoms.ts`) are general knowledge of the Israeli system. No source above states them. The NHS refers to UK services (999, 111, midwife), and these were adapted to Israel.
- **"הרופא/ה המטפל/ת או מוקד הקופה"** as the contact for non-urgent cases is an adaptation of the NHS "midwife or GP".
- **Week 4 note** ("זה הזמן לקבוע תור לרופא/ת נשים"): the Ministry of Health says to book an appointment with a gynecologist after a positive test. Linking that to week 4 specifically is our wording.

## Deliberately not included

- **Doses of any medicine or supplement.** For example, the NHS week 4 page mentions folic acid with a dose, and Midaat gives a folic acid dose. Doses were left out on purpose. The medications screen only records what her doctor prescribed.
- UK-specific items from the NHS week pages: free prescriptions and dental care, MAT B1 forms, the RSV and whooping-cough timing used in the UK, and UK birth statistics. For the pertussis vaccine, the Israeli window from Leumit and Midaat (27–36) is used.
- Bleeding gums, nosebleeds and stretch marks as separate symptoms: the NHS pages that were read had no guidance on these, or they were not fetched.
- Depression screening from week 26: it appears only in Midaat (a single secondary source). Mental health is covered in the warning signs from NHS `nhs-get-help`.

## Timing differences shown in the app (in each test's `notes`)

- Dating ultrasound: Ministry of Health 6–12; Maccabi 6–7; Leumit 6–10 (11 on another page).
- NT: Ministry of Health and Midaat 11–13; Leumit 11–14.
- Early anatomy scan: Ministry of Health main table 12–16; Ministry of Health screening page, Maccabi and Leumit 14–16; Midaat 13–17. **The app uses 14–16** and mentions 12–16.
- Triple screen: Ministry of Health main table and Maccabi 16–19; Ministry of Health screening page, Leumit and Midaat 16–20. The app uses 16–19.
- Late anatomy scan: Ministry of Health 20–24 (recommended 20–23); Maccabi 21–24; Leumit and Midaat 19–25.
- Glucose challenge: Ministry of Health and Midaat 24–28; Leumit 24–26.
- GBS: Ministry of Health 36–37 for all women; Leumit 35–37 by the doctor's decision.
- Amniocentesis age threshold: Ministry of Health, Leumit and Kol Zchut 32; Midaat 35.
