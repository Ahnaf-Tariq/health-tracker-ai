import type {
  GlucoseCategory,
  GlucoseMeasurement,
  MetricClassification,
  ValidatedInputs,
} from "./types";

export const CLINICAL_SOURCES = [
  {
    name: "American Heart Association: Blood pressure readings",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
  },
  {
    name: "American Heart Association: When to call 911 about high blood pressure",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure",
  },
  {
    name: "National Institute of Diabetes and Digestive and Kidney Diseases: Diabetes tests",
    url: "https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis",
  },
  {
    name: "CDC: About sleep",
    url: "https://www.cdc.gov/sleep/about/index.html",
  },
  {
    name: "National Institute on Aging: Sleep and older adults",
    url: "https://www.nia.nih.gov/health/sleep/sleep-and-older-adults",
  },
  {
    name: "American Heart Association: 2025 high blood pressure guideline overview",
    url: "https://professional.heart.org/en/science-news/2025-high-blood-pressure-guideline",
  },
  {
    name: "American Heart Association: Resting heart rate",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse",
  },
  {
    name: "NIDDK: Low blood glucose",
    url: "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/low-blood-glucose-hypoglycemia",
  },
  {
    name: "CDC: Diabetic ketoacidosis warning signs",
    url: "https://www.cdc.gov/diabetes/about/diabetic-ketoacidosis.html",
  },
  {
    name: "CDC: Stroke warning signs",
    url: "https://www.cdc.gov/stroke/signs-symptoms/index.html",
  },
  {
    name: "CDC: Urgent maternal warning signs",
    url: "https://www.cdc.gov/hearher/maternal-warning-signs/index.html",
  },
  {
    name: "ACOG: High blood pressure during pregnancy",
    url: "https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy",
  },
  {
    name: "NICE NG246: BMI and waist-to-height reference",
    url: "https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity",
  },
  {
    name: "NHS: Tiredness and fatigue",
    url: "https://www.nhs.uk/symptoms/tiredness-and-fatigue/",
  },
  { name: "NHS: Chest pain", url: "https://www.nhs.uk/symptoms/chest-pain/" },
  {
    name: "WHO: Physical activity",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
  },
  {
    name: "FDA: Caffeine amounts vary",
    url: "https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much",
  },
  {
    name: "NIDDK: Fluid limits in kidney disease",
    url: "https://www.niddk.nih.gov/health-information/kidney-disease/kidney-failure/eating-right",
  },
  {
    name: "NIDDK: HbA1c limitations",
    url: "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test",
  },
  {
    name: "NHS: Blood pressure in pregnancy",
    url: "https://www.nhs.uk/pregnancy/existing-health-conditions/high-blood-pressure/",
  },
] as const;

/** Safety context applies even when a value cannot receive a diabetes screening label. */
export function glucoseSafetyCategory(
  measurement?: GlucoseMeasurement,
): "Low glucose reading" | "Very high glucose reading" | undefined {
  if (!measurement || measurement.testType === "hba1c") return undefined;
  const { value, unit } = measurement;
  if (unit !== "mg/dL" && unit !== "mmol/L") return undefined;
  if (value < (unit === "mmol/L" ? 3.9 : 70)) return "Low glucose reading";
  if (value >= (unit === "mmol/L" ? 16.7 : 300))
    return "Very high glucose reading";
  return undefined;
}

const displayOnly = (value: number): MetricClassification<GlucoseCategory> => ({
  value,
  category: "Shown without interpretation",
  note: "This value is shown as entered. Health Tracker does not have enough information to apply a lab screening range safely.",
  tip: "Ask your healthcare professional what this result means for you.",
});

export function classifyGlucose(
  measurement: GlucoseMeasurement | undefined,
  inputs: Pick<ValidatedInputs, "conditions" | "pregnantOrBreastfeeding">,
): MetricClassification<GlucoseCategory> | undefined {
  if (!measurement) return undefined;
  const { value, testType, unit, fastingConfirmed } = measurement;
  const safetyCategory = glucoseSafetyCategory(measurement);
  if (safetyCategory)
    return {
      value,
      category: safetyCategory,
      note:
        safetyCategory === "Low glucose reading"
          ? "This entered glucose value is below a common low-glucose alert level (70 mg/dL or 3.9 mmol/L). It must not be treated as a reassuring diabetes-screening result. The app cannot tell whether a past laboratory result describes your current glucose."
          : "This entered glucose value is very high. If a current reading stays at 300 mg/dL (about 16.7 mmol/L) or above, seek emergency care. Trouble breathing, confusion, vomiting that prevents drinking, or high ketones also need emergency help; do not wait for another reading when seriously unwell.",
      tip:
        safetyCategory === "Low glucose reading"
          ? "If this is current, follow your low-glucose care plan. If fully awake and able to swallow safely, take 15–20 g of glucose and recheck after 15 minutes; repeat if still low. If confused, fainting, unable to swallow safely or needing help to treat it, call emergency services and do not give food or drink by mouth. Discuss historical or unexplained low results promptly with a clinician."
          : "Contact a clinician promptly about this result, even if you feel well. Historical results need clinical follow-up rather than being assumed to be a current emergency. Follow your prescribed sick-day plan if you have one; do not change medicines based on this app.",
    };
  if (inputs.pregnantOrBreastfeeding === "pregnant") {
    return {
      ...displayOnly(value),
      note: "Pregnancy can use different glucose-testing ranges. This value is shown without screening interpretation; please use guidance from your pregnancy-care team.",
    };
  }
  if (inputs.conditions.includes("diabetes")) {
    return {
      ...displayOnly(value),
      note: "Your own diabetes targets depend on your care plan. This value is shown without a general screening label; follow up with your healthcare professional.",
    };
  }
  if (testType === "other") {
    return {
      ...displayOnly(value),
      note: "Home-meter, non-fasting, or uncertain-source results are shown as entered only. Consumer glucose meters do not diagnose diabetes.",
    };
  }
  if (testType === "fasting" && !fastingConfirmed) {
    return {
      ...displayOnly(value),
      note: "A fasting glucose range applies only to a lab test taken after at least 8 hours with nothing to eat or drink except water. Because that was not confirmed, this value is shown without screening interpretation.",
    };
  }
  if (testType === "hba1c" && inputs.conditions.includes("anemia")) {
    return {
      ...displayOnly(value),
      note: "Anemia can affect how HbA1c is interpreted. This value is shown without a screening label; ask your healthcare professional about a suitable test.",
    };
  }
  if (testType === "hba1c" && inputs.conditions.includes("kidneyDisease"))
    return {
      ...displayOnly(value),
      note: "Kidney failure and some related treatments can make HbA1c unreliable. This form does not establish kidney-disease stage or treatment, so it withholds a screening label rather than assuming this result is interpretable. Ask your clinician.",
    };

  let category: GlucoseCategory;
  let testLabel: string;
  if (testType === "hba1c") {
    testLabel = "HbA1c";
    category =
      value < 5.7
        ? "Below common screening cutoff"
        : value < 6.5
          ? "Common increased-risk screening range"
          : "At or above a common screening threshold";
  } else if (unit === "mmol/L") {
    testLabel = "Fasting laboratory glucose";
    category =
      value < 5.6
        ? "Below common screening cutoff"
        : value < 7
          ? "Common increased-risk screening range"
          : "At or above a common screening threshold";
  } else {
    testLabel = "Fasting laboratory glucose";
    category =
      value < 100
        ? "Below common screening cutoff"
        : value < 126
          ? "Common increased-risk screening range"
          : "At or above a common screening threshold";
  }

  const notes: Record<GlucoseCategory, string> = {
    "Below common screening cutoff": `This ${testLabel} result is below a commonly used screening cutoff. It does not assess every health concern or replace personal medical advice.`,
    "Common increased-risk screening range": `This ${testLabel} result is within a range commonly used for screening. It is not a diagnosis; a clinician can interpret it with your health history and decide whether to repeat testing.`,
    "At or above a common screening threshold": `This ${testLabel} result is at or above a commonly used screening threshold. This app cannot diagnose a condition; a clinician usually confirms results with another test, although clear symptoms and other findings can change the diagnostic process. Please contact a healthcare professional.`,
    "Low glucose reading": "Low glucose needs separate safety context.",
    "Very high glucose reading":
      "Very high glucose needs separate safety context.",
    "Shown without interpretation":
      "This value is shown as entered without a general screening label.",
  };
  const tip =
    testType === "hba1c"
      ? "HbA1c may be unreliable with anemia, hemoglobin variants, kidney or liver failure, recent blood loss or transfusion, or certain treatments. This form does not check every limitation; a clinician must decide whether the test is suitable."
      : "A clinician can confirm the fasting conditions and interpret this result alongside your health history.";
  return { value, category, note: notes[category], tip };
}

export function glucoseTestLabel(
  testType: GlucoseMeasurement["testType"],
): string {
  switch (testType) {
    case "fasting":
      return "Fasting laboratory glucose";
    case "hba1c":
      return "HbA1c laboratory result";
    case "other":
      return "Other / home meter / unsure";
  }
}
