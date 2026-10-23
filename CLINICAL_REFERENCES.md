# Health Tracker: Clinical and design references

**Reviewed:** 2026-10-15. This is a source-based software audit, not clinical validation, certification, or a guarantee of medical accuracy. A qualified clinician must review the implementation and its intended use before it is relied on for health decisions.

## Blood pressure

The American Heart Association's patient guide lists these adult categories: normal, below 120 and below 80 mmHg; elevated, systolic 120–129 and diastolic below 80; stage 1, systolic 130–139 or diastolic 80–89; stage 2, systolic at least 140 or diastolic at least 90. A medical professional—not this app—confirms a diagnosis. [1]

For a reading above 180 systolic or 120 diastolic, AHA says to wait one minute and repeat. If the repeat remains similarly high without symptoms, contact a healthcare professional as soon as possible. With concerning symptoms, get emergency help without waiting. [2] The app checks every entered reading, not only the average, and suppresses routine suggestions for potentially unsafe readings. These are AHA adult references, not universal international diagnostic criteria or personal treatment targets.

AHA's 2025 guideline summary says the new guideline replaces the 2017 guideline and highlights accurate measurement and home monitoring. Treatment targets depend on a clinician's assessment and the person's circumstances; Health Tracker does not set medication or personal treatment targets. [3]

## Optional laboratory glucose values

NIDDK describes these as laboratory screening/diagnosis thresholds for people who are not pregnant: A1C below 5.7%, 5.7–6.4%, and at least 6.5%; fasting plasma glucose at or below 99 mg/dL, 100–125 mg/dL, and at least 126 mg/dL, respectively. The page says clinicians usually use a second test to confirm diabetes; pregnancy may use different cutoffs; anemia or hemoglobin variants can affect A1C; and an over-the-counter glucose meter cannot diagnose diabetes. [4]

Health Tracker will present these only as screening context for a user-entered laboratory result, not label a person as having diabetes or prediabetes. It will not classify pregnancy readings. Personal targets for known conditions remain with the person's clinician.

## Sleep and older adults

The CDC's current table gives 7–8 hours for adults 65 and older. The National Institute on Aging says older adults need about the same as all adults, 7–9 hours. Because these public guidance sources differ slightly, the app will use its existing broad 7–9-hour adult reference as a soft, non-diagnostic guide rather than treat one exact older-adult cutoff as a health finding. Sleep quality and the person's own care context also matter. [5] [6]

## Visual reference

The Awwwards Minimal collection describes the design principles of minimalism as balance, alignment, and contrast, with unnecessary elements removed. Health Tracker will use these general principles—while prioritizing comfortable reading size, high contrast, clear labels, and large touch targets for older adults—without copying a listed site. [7]

## Medical audit and corrections — 2026-10-15

### Optional BP and blood type update

BP is optional. Completely empty rows are ignored; a started row still requires both valid values. No average, normal BP, zero reading or BP-related diagnosis is inferred when it is absent. The report retains BMI, sleep, reported activity/stress, symptom follow-up and independent emergency warnings. Its **“Confidence: lower”** note refers specifically to missing BP information and explains that a properly measured value would add BP screening context and BP-specific safety checks. This label is not a calibrated probability, validated diagnostic confidence score, or a claim that providing BP makes the entire report medically accurate.

Optional ABO/RhD blood type is collected before the other personal fields using the eight common groups plus unknown/skip. It is self-reported, not laboratory verified. The only conditional clinical context added is discussion of blood grouping and antibody screening during pregnancy, including RhD-negative status and asking whether anti-D prevention is appropriate. Maternal group alone does not establish fetal group, sensitisation, incompatibility, or a need for treatment. RhD-positive status does not rule out all other clinically significant red-cell antibodies. See [NHS blood groups](https://www.nhs.uk/tests-and-treatments/blood-groups/) and [NHS pregnancy/HDFN guidance](https://www.nhs.uk/conditions/rhesus-disease-hdfn/).

Blood type does **not** change vital-sign thresholds, symptom urgency, BMI categories, diet advice, report status or overall health predictions. [He et al.'s prospective cohort study](https://pubmed.ncbi.nlm.nih.gov/22895671/) reports population-level ABO/CHD associations; it is not a validated individual diagnostic/prediction algorithm for this form. Inferring a personal condition or assigning a risk percentage from that association would be unsupported. [Wang et al.'s primary study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0084749) did not support matching a diet to ABO type. These evidence limits are reflected in the interface and exports. A self-reported blood type is never used to select transfusions; clinical laboratory testing/crossmatching remains necessary.

| Area | Finding and correction | Basis |
| --- | --- | --- |
| Energy score | Removed the arbitrary weighted score, High/Low energy bands, factor point bars, and confidence labels from calculations, screen, copy, print, and PDF. No validated inference of biological energy or overall health was supported. Missing fields now describe data availability only. | No clinical validation or supporting study was supplied for the former algorithm. |
| Resting heart rate | Corrected the usual adult reference to 60–100 bpm. Rates below 60 receive lower-reading context; exercise, medication and symptoms matter. A muscular-build checkbox cannot establish safety. | AHA pulse guidance [8]. |
| Low blood pressure | An otherwise non-elevated reading below 90 systolic or 60 diastolic is labeled low rather than normal. Symptoms and personal context determine clinical significance. | AHA low-BP guidance [9]. |
| Validation | Removed the rejection of pulse pressures below 20 or above 100. Real abnormal readings must reach safety handling. Input bounds are software entry limits, not normal physiological ranges. Safety messages can be shown before unrelated required fields are complete. | Software defect found during the audit; AHA emergency guidance [2]. |
| Glucose safety | Below 70 mg/dL or 3.9 mmol/L receives low-glucose context before fasting, pregnancy, known-diabetes or meter exclusions. At least 300 mg/dL or about 16.7 mmol/L receives very-high context: a persistent current reading or serious symptoms need emergency help. HbA1c percentage is never treated as a current glucose reading. | NIDDK low-glucose guidance [10]; CDC DKA guidance [11]. |
| Historical lab values | The form has no measurement date or real-time monitoring. Safety copy distinguishes a past result from a current reading. These numeric alerts cannot establish hypoglycemia, DKA, or the need for a particular medicine. | Test interpretation and missing timing/context. |
| HbA1c | Retained screening cutoffs, but do not interpret during pregnancy, known diabetes, reported anemia or reported kidney disease. Kidney stage is unknown, so withholding is conservative; not all kidney disease makes HbA1c unusable. Added limitations for hemoglobin variants, transfusion, blood loss, kidney/liver failure and treatments. | NIDDK diabetes tests [4] and A1C limitations [12]. |
| Emergency symptoms | New/sudden neurological symptoms, new/persistent chest pain and sudden/severe breathlessness no longer require high BP or a second symptom to show urgent guidance. Checkbox labels now specify the intended symptom context. | CDC stroke guidance [13], NHS chest pain [14], NHS breathlessness [15]. |
| Pregnancy | A reported pregnancy BP of at least 160 systolic OR 110 diastolic triggers immediate maternity/emergency assessment guidance without needing another symptom. Severe headache/vision change/marked swelling may need immediate care without high BP. | ACOG [16], NHS pregnancy BP [17], CDC maternal warnings [18]. |
| Postpartum limitation | Birth date is not collected. Breastfeeding is an imperfect proxy, so the app deliberately uses a cautious maternity path for those users. It can over-flag people breastfeeding long after birth and cannot identify all postpartum users who are not breastfeeding. Maternal complications can occur within a year of birth regardless of feeding method. | CDC [18]. This is an application limitation, not a clinically validated triage rule. |
| Fatigue | Ongoing fatigue prompts clinician discussion regardless of sleep duration. BP/BMI/waist are not presented as proven causes of fatigue. | NHS tiredness and fatigue [19]. |
| BMI/waist | Standard and selected Asian action thresholds retained as population screening context. Waist ratio comparisons use unrounded values and are limited to non-pregnant/non-breastfeeding adults with BMI below 35. No personal disease probability is computed. The available background options do not cover every ethnicity with lower action thresholds. | NICE NG246 [20]. |
| Display precision | BMI and waist calculations retain their unrounded values. BP, BMI and waist display rounded numbers with `~` when necessary, while classification uses the original value. This prevents implying that a displayed rounded value is an exact threshold measurement. | Numerical presentation correction; not a new biological threshold. |
| Activity, hydration, caffeine | Unspecified activity minutes do not establish whether someone meets the moderate/vigorous activity recommendation. Cup counts do not measure caffeine mg; water glasses do not establish hydration. No fluid-increase prompt for reported heart/kidney disease. | WHO [21], FDA [22], NIDDK kidney guidance [23]. |
| Reassurance | Replaced “Looking good” with “No automatic flags”, explicitly stating this does not mean healthy or rule out illness. | Missing history, examinations and unmeasured conditions make a general health verdict unsupported. |

### Important remaining limits

- This is a wellness information tool, **not an emergency detector, diagnostic system, validated symptom checker, or treatment planner**. Unflagged inputs do not establish safety. Do not wait for it to obtain emergency help.
- The symptom checklist lacks detailed timing, severity, examination and history. Conservative warnings can over-triage; missing or unreported symptoms can be missed. Normal-looking readings do not rule out emergencies.
- Free text is not medically interpreted. The self-harm/disordered-eating filters are keyword heuristics with false positives and false negatives, not diagnoses or complete risk assessments. They are not monitored. No LLM is connected.
- Hemoglobin and cholesterol are displayed without interpretation; dates, laboratory flags, reference intervals, lipid fractions and key clinical context are absent. “No automatic flags” does not clear these results. A clinician must interpret them, including urgent lab notifications.
- Sleep uses a broad 7–9-hour adult reference with age/circumstance caveats. The CDC table differs by age [5]; a “Long” or “Borderline” label is not a disorder diagnosis. No sleep-based energy penalty remains.
- No drug, insulin, supplement, weight-loss or calorie prescription is generated. General low-glucose first-aid context is conditional on a current reading and being fully awake/able to swallow; personal clinical plans take precedence.
- The medical unit thresholds used in mg/dL and mmol/L are conventional rounded guideline values; conversion near boundaries can change the apparent side of a cutoff. Clinical decisions require the laboratory's units, precision and professional interpretation.
- The cited NICE and ACOG pages were accessible through their official indexed excerpts; full-page retrieval was blocked by their sites during this audit. Their key statements were cross-checked against official NICE rationale excerpts and NHS pregnancy guidance. This limitation is recorded rather than claiming complete document review.
- Automated regression tests check implementation and important boundaries; passing tests do not establish medical accuracy, clinical safety, sensitivity, specificity or outcomes. Independent clinical review and broader validation remain outstanding.

## References

[1]: https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings "American Heart Association: Understanding Blood Pressure Readings"
[2]: https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure "American Heart Association: When to Call 911 About High Blood Pressure"
[3]: https://professional.heart.org/en/science-news/2025-high-blood-pressure-guideline "American Heart Association: 2025 High Blood Pressure Guideline"
[4]: https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis "NIDDK: Diabetes Tests & Diagnosis"
[5]: https://www.cdc.gov/sleep/about/index.html "CDC: About Sleep"
[6]: https://www.nia.nih.gov/health/sleep/sleep-and-older-adults "National Institute on Aging: Sleep and Older Adults"
[7]: https://www.awwwards.com/websites/minimal/ "Awwwards: Minimal Websites"
[8]: https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse
[9]: https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/low-blood-pressure-when-blood-pressure-is-too-low
[10]: https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/low-blood-glucose-hypoglycemia
[11]: https://www.cdc.gov/diabetes/about/diabetic-ketoacidosis.html
[12]: https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test
[13]: https://www.cdc.gov/stroke/signs-symptoms/index.html
[14]: https://www.nhs.uk/symptoms/chest-pain/
[15]: https://www.nhs.uk/symptoms/shortness-of-breath/
[16]: https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy
[17]: https://www.nhs.uk/pregnancy/existing-health-conditions/high-blood-pressure/
[18]: https://www.cdc.gov/hearher/maternal-warning-signs/index.html
[19]: https://www.nhs.uk/symptoms/tiredness-and-fatigue/
[20]: https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity
[21]: https://www.who.int/news-room/fact-sheets/detail/physical-activity
[22]: https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much
[23]: https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/eating-right
