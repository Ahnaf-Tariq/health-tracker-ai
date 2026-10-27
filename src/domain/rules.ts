import { DISCLAIMER } from "./constants";
import { hasDisorderedEatingConcern, hasSelfHarmConcern } from "./privacy";
import type {
  BPCategory,
  BMICategory,
  FormData,
  HRCategory,
  MetricClassification,
  SafetyFlags,
  ValidatedInputs,
  WellnessReport,
} from "./types";
import { checkInContext } from "./context";
import { bloodTypeContext } from "./bloodType";
import { formatMeasurement } from "./format";
import { classifyGlucose, glucoseSafetyCategory } from "./clinicalGuidance";

const BP_ORDER: Record<BPCategory, number> = {
  "Low reading": 0,
  Normal: 0,
  Elevated: 1,
  "Stage 1": 2,
  "Stage 2": 3,
};

export function classifyBP(
  systolic: number,
  diastolic: number,
): MetricClassification<BPCategory> {
  const systolicClass: BPCategory =
    systolic >= 140
      ? "Stage 2"
      : systolic >= 130
        ? "Stage 1"
        : systolic >= 120
          ? "Elevated"
          : "Normal";
  const diastolicClass: BPCategory =
    diastolic >= 90 ? "Stage 2" : diastolic >= 80 ? "Stage 1" : "Normal";
  let category: BPCategory =
    BP_ORDER[systolicClass] >= BP_ORDER[diastolicClass]
      ? systolicClass
      : diastolicClass;
  let note =
    "One reading is not a diagnosis. A single measurement can be affected by how and when it was taken.";
  let tip =
    "If you repeat it at home, sit quietly first; use a validated cuff on the same arm and avoid talking.";
  if (category === "Elevated")
    note =
      "This reading is a little above the usual range. Repeating it over time can give a clearer picture.";
  if (category === "Stage 1")
    note =
      "This reading is above the usual range. Your clinician can help put repeated measurements in context.";
  if (category === "Stage 2")
    note =
      "This reading is higher than usual. Please re-check it calmly and discuss repeated readings with a doctor.";
  if (systolic >= 140 && diastolic < 90 && systolic <= 180)
    note +=
      " Only the top number is high (isolated systolic). This pattern is common in young adults and can be temporary after stress, caffeine, poor sleep, or a rushed measurement, so repeat it on separate days before drawing conclusions. Persistently high readings still need clinical confirmation.";
  if (systolic > 180 || diastolic > 120) {
    note =
      "This is a very high reading. If you have no concerning symptoms, wait at least one minute and repeat it. If the repeated reading stays this high, contact a healthcare professional as soon as possible. If you develop chest pain, shortness of breath, back pain, numbness, weakness, confusion, a severe headache, vision changes, or difficulty speaking, call your local emergency number now.";
    tip =
      "Sit quietly for at least one minute, then repeat the reading. If it remains above 180 systolic or 120 diastolic, contact a healthcare professional as soon as possible.";
  }
  if (systolic < 90 || diastolic < 60) {
    if (category === "Normal") category = "Low reading";
    note +=
      " One or both numbers are also below 90/60, a low-reading note—especially if you feel dizzy, faint, or unusually tired.";
    tip =
      "If you feel faint, confused, or unwell, seek prompt medical advice. Your doctor can help interpret repeat readings.";
  }
  return { value: systolic, category, note, tip };
}

export function classifyBMI(
  weightKg: number,
  heightCm: number,
  region: ValidatedInputs["region"],
): MetricClassification<BMICategory> {
  const bmi = weightKg / (heightCm / 100) ** 2;
  const adjusted = region === "south-asian" || region === "east-asian";
  const category: BMICategory =
    bmi < 18.5
      ? "Underweight"
      : adjusted
        ? bmi < 23
          ? "Normal"
          : bmi < 27.5
            ? "Increased risk"
            : "High risk"
        : bmi < 25
          ? "Normal"
          : bmi < 30
            ? "Overweight"
            : "Obese";
  let note = adjusted
    ? "This uses NICE lower BMI action thresholds (23 and 27.5) for the selected Asian background. These are population screening references, not personal risk estimates."
    : "This uses general adult BMI screening thresholds. Some ethnic backgrounds have increased cardiometabolic risk at a lower BMI. BMI alone cannot determine your health.";
  let tip =
    "Consider the whole picture—how you feel, waist measurement and your clinician’s advice—not BMI alone.";
  if (category === "Underweight") {
    const grade =
      bmi < 16
        ? "severe thinness (BMI below 16)"
        : bmi < 17
          ? "moderate thinness (BMI 16 to 16.9)"
          : "mild thinness (BMI 17 to 18.4)";
    note = `Below 18.5 is underweight; by the WHO grading this falls in ${grade}. Low body weight can go along with low energy, lower immunity and bone or hormone effects, and sometimes has a medical or nutritional cause. ${note}`;
    tip =
      "Ask a doctor or dietitian whether your weight is right for you and whether any checks (for example blood count, thyroid, or nutrition status) make sense. Avoid trying to change weight on your own through extreme eating or exercise.";
  }
  return { value: bmi, category, note, tip };
}

export function classifySleep(
  hours: number,
  age = 18,
): MetricClassification<"Short" | "Borderline" | "Recommended range" | "Long"> {
  const recommendedMax = age >= 65 ? 8 : 9;
  if (hours < 6)
    return {
      value: hours,
      category: "Short",
      note: "This is below the usual adult sleep range; short sleep can affect daytime energy.",
      tip: "If it fits your life, try a steady wind-down and wake-up time.",
    };
  if (hours < 7)
    return {
      value: hours,
      category: "Borderline",
      note: "This is near but a little below the usual adult sleep range.",
      tip: "A small, realistic shift toward a regular sleep window may help.",
    };
  if (hours <= recommendedMax)
    return {
      value: hours,
      category: "Recommended range",
      note: `This is within this tool’s broad 7–${recommendedMax}-hour reference for adults${age >= 65 ? " aged 65 and older" : " aged 18–64"}. Recommendations vary with circumstances; sleep quality and how you feel also matter.`,
      tip: "Keeping a routine that works for you can support rest.",
    };
  return {
    value: hours,
    category: "Long",
    note: `More than ${recommendedMax} hours is above this tool’s broad reference for adults${age >= 65 ? " aged 65 and older" : " aged 18–64"}, but can be appropriate during recovery or in some circumstances. Duration alone does not establish a sleep disorder or explain fatigue.`,
    tip: "If long sleep is new or you still feel tired, consider discussing it with a doctor.",
  };
}

export function hemoglobinReferenceNote(
  value: number,
  sexAtBirth: ValidatedInputs["sexAtBirth"],
  pregnantOrBreastfeeding: ValidatedInputs["pregnantOrBreastfeeding"],
): string | undefined {
  if (sexAtBirth === "prefer-not-to-say") return undefined;
  const cutoff =
    pregnantOrBreastfeeding === "pregnant"
      ? 11
      : sexAtBirth === "male"
        ? 13
        : 12;
  return value < cutoff
    ? "This value may be below the usual reference range; worth discussing with a doctor."
    : undefined;
}

export function classifyHeartRate(
  bpm: number,
  muscularBuild: boolean,
): MetricClassification<HRCategory> {
  if (bpm >= 50 && bpm < 60)
    return {
      value: bpm,
      category: "Below 60, often normal",
      note: muscularBuild
        ? "A resting rate in the 50s is common with regular training. How you feel matters more than the number."
        : "A resting rate in the 50s is below the usual 60–100 reference but is common and generally not a concern in healthy young adults without symptoms. How you feel matters more than the number.",
      tip: "No action is usually needed if you feel well. Seek advice if you also have dizziness, fainting, chest discomfort, breathlessness or unusual tiredness, or if your rate suddenly changes.",
    };
  if (bpm < 50)
    return {
      value: bpm,
      category: "Low reading",
      note: muscularBuild
        ? "A lower resting heart rate can be common with regular training. How you feel matters too."
        : "This is a lower resting reading. It can be normal for some people, including athletes; symptoms matter.",
      tip: "Discuss a new or persistent lower resting rate with a clinician. If the rate is suddenly unusual for you with chest pain, breathlessness, dizziness or fainting, seek emergency help. A muscular build alone does not establish that a low rate is safe.",
    };
  if (bpm > 100)
    return {
      value: bpm,
      category: "High reading",
      note: "This is above the usual adult resting range; activity, stress, caffeine, or illness can affect a reading.",
      tip: "Rest quietly and repeat the measurement. Ask a doctor if it stays high or you feel unwell.",
    };
  return {
    value: bpm,
    category: "Usual range",
    note: "This resting reading is within the usual adult range.",
    tip: "Use a calm, rested reading when you compare measurements.",
  };
}

export function waistHeightRatio(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

type SafetyInputs = Pick<
  ValidatedInputs,
  | "systolic"
  | "diastolic"
  | "bloodPressureReadings"
  | "symptoms"
  | "pregnantOrBreastfeeding"
  | "notes"
  | "restingHeartRate"
  | "fatigueTwoWeeks"
  | "glucose"
>;

/** Checks entered safety signals without requiring unrelated form fields. NaN means not entered, never a fabricated reading. */
export function previewSafety(form: FormData): SafetyFlags {
  const entered = (raw: string) =>
    /^(?:\d+\.?\d*|\.\d+)$/.test(raw.trim()) ? Number(raw) : Number.NaN;
  const readings = form.readings.map((row) => ({
    systolic: entered(row.systolic),
    diastolic: entered(row.diastolic),
  }));
  const glucoseValue = entered(form.glucoseValue);
  return getSafetyFlags({
    systolic: readings[0]?.systolic ?? Number.NaN,
    diastolic: readings[0]?.diastolic ?? Number.NaN,
    bloodPressureReadings: readings,
    symptoms: form.symptoms,
    pregnantOrBreastfeeding: form.pregnantOrBreastfeeding || undefined,
    notes: form.notes,
    restingHeartRate: entered(form.restingHeartRate),
    fatigueTwoWeeks: form.fatigueTwoWeeks,
    glucose:
      Number.isFinite(glucoseValue) && form.glucoseTestType
        ? {
            value: glucoseValue,
            testType: form.glucoseTestType,
            unit: form.glucoseUnit,
            fastingConfirmed: form.glucoseFastingConfirmed,
          }
        : undefined,
  });
}

export function getSafetyFlags(inputs: SafetyInputs): SafetyFlags {
  const has = (key: ValidatedInputs["symptoms"][number]) =>
    inputs.symptoms.includes(key);
  const chestWithBreathlessness =
    has("chestDiscomfort") && has("shortnessOfBreath");
  const palpitationsWithDizziness = has("palpitations") && has("dizziness");
  const fainting = has("fainting");
  const readings = [
    ...inputs.bloodPressureReadings,
    ...(inputs.systolic !== undefined && inputs.diastolic !== undefined
      ? [{ systolic: inputs.systolic, diastolic: inputs.diastolic }]
      : []),
  ];
  const crisisBloodPressure = readings.some(
    ({ systolic, diastolic }) => systolic > 180 || diastolic > 120,
  );
  const maternityContext =
    inputs.pregnantOrBreastfeeding === "pregnant" ||
    inputs.pregnantOrBreastfeeding === "breastfeeding";
  const severeMaternityBP =
    maternityContext &&
    readings.some(
      ({ systolic, diastolic }) => systolic >= 160 || diastolic >= 110,
    );
  const pregnancyConcern =
    maternityContext &&
    (severeMaternityBP ||
      has("headache") ||
      has("visionChanges") ||
      has("swelling"));
  const selfHarmConcern = hasSelfHarmConcern(inputs.notes);
  const disorderedEatingConcern = hasDisorderedEatingConcern(inputs.notes);
  const urgentReasons: string[] = [];
  if (has("chestDiscomfort"))
    urgentReasons.push(
      "You reported new or unexplained chest discomfort. Sudden or persistent chest pain can be an emergency even without breathlessness or high blood pressure. Get urgent assessment; call emergency services if it is happening now or is sudden or persistent.",
    );
  if (has("shortnessOfBreath"))
    urgentReasons.push(
      "You reported sudden or severe breathlessness. If you are gasping, cannot speak normally, or have suddenly become very breathless, call emergency services now; do not wait for blood pressure or other readings.",
    );
  if (
    [
      "speechChanges",
      "confusion",
      "numbness",
      "weakness",
      "visionChanges",
      "headache",
    ].some((key) => has(key as ValidatedInputs["symptoms"][number]))
  )
    urgentReasons.push(
      "You reported a possible neurological warning sign. Sudden trouble speaking, confusion, one-sided weakness or numbness, vision loss, or a sudden severe headache needs emergency assessment regardless of blood pressure—even if it improves. This app cannot establish the cause or timing.",
    );
  if (severeMaternityBP)
    urgentReasons.push(
      "A reading of at least 160 systolic or 110 diastolic was reported during pregnancy or breastfeeding. Contact maternity or emergency care immediately; pregnancy-related high blood pressure needs a different safety threshold. Breastfeeding does not establish how recently birth occurred, so the app uses a cautious maternity safety pathway.",
    );
  const severePressureSymptoms = [
    "chestDiscomfort",
    "shortnessOfBreath",
    "backPain",
    "numbness",
    "weakness",
    "speechChanges",
    "confusion",
    "headache",
    "visionChanges",
  ] as const;
  if (crisisBloodPressure && severePressureSymptoms.some(has)) {
    urgentReasons.push(
      "A very high blood-pressure reading was reported with a concerning symptom. Call your local emergency number now.",
    );
  }
  if (chestWithBreathlessness)
    urgentReasons.push(
      "You checked both chest discomfort and shortness of breath.",
    );
  if (palpitationsWithDizziness)
    urgentReasons.push("You checked palpitations along with dizziness.");
  if (fainting) urgentReasons.push("You reported fainting.");
  if (pregnancyConcern)
    urgentReasons.push(
      "Severe headache, vision changes or marked swelling during pregnancy or after birth needs immediate medical assessment even without a high blood-pressure reading. Tell the care team if you are pregnant or have given birth within the past year.",
    );
  const urgent = urgentReasons.length > 0;
  const crisisOrRedFlag =
    urgent ||
    crisisBloodPressure ||
    has("chestDiscomfort") ||
    has("shortnessOfBreath") ||
    has("swelling") ||
    has("dizziness") ||
    has("palpitations") ||
    has("fainting");
  const abnormalVitals =
    readings.some(
      ({ systolic, diastolic }) =>
        systolic >= 120 || diastolic >= 80 || systolic < 90 || diastolic < 60,
    ) ||
    (inputs.restingHeartRate !== undefined &&
      (inputs.restingHeartRate < 50 || inputs.restingHeartRate > 100));
  const bpLow = readings.some(
    ({ systolic, diastolic }) => systolic < 90 || diastolic < 60,
  );
  const glucoseConcern = glucoseSafetyCategory(inputs.glucose) !== undefined;
  return {
    urgent,
    urgentReasons,
    crisisBloodPressure,
    pregnancyConcern,
    crisisOrRedFlag,
    selfHarmConcern,
    disorderedEatingConcern,
    abnormalVitals,
    glucoseConcern,
    medicalReview:
      crisisOrRedFlag ||
      inputs.fatigueTwoWeeks ||
      glucoseConcern ||
      severeMaternityBP ||
      readings.some(
        ({ systolic, diastolic }) => systolic >= 140 || diastolic >= 90,
      ) ||
      (maternityContext &&
        readings.some(
          ({ systolic, diastolic }) => systolic >= 140 || diastolic >= 90,
        )) ||
      (bpLow && has("dizziness")),
  };
}

function doctorQuestions(
  inputs: ValidatedInputs,
  glucose?: MetricClassification<import("./types").GlucoseCategory>,
  bmiCategory?: BMICategory,
): string[] {
  const questions = [
    "Which health checks make sense based on my symptoms and measurements?",
    "How and when should I repeat these measurements at home?",
    "What changes should I track to help understand how my energy is doing?",
  ];
  if (inputs.fatigueTwoWeeks)
    questions.unshift(
      "Could we talk about my ongoing tiredness and what might be contributing to it?",
    );
  if (
    (inputs.systolic !== undefined && inputs.systolic < 90) ||
    (inputs.diastolic !== undefined && inputs.diastolic < 60)
  )
    questions.push(
      "Could this lower reading matter alongside the way I have been feeling?",
    );
  if (inputs.snores || inputs.wakeUnrefreshed)
    questions.push(
      "Could my sleep quality help explain how I feel during the day?",
    );
  if (inputs.conditions.length || inputs.medication === "yes")
    questions.push(
      "How should I interpret these values given my personal health history or medicines?",
    );
  if (
    (inputs.systolic !== undefined && inputs.systolic > 180) ||
    (inputs.diastolic !== undefined && inputs.diastolic > 120)
  )
    questions.unshift(
      "If my repeated blood-pressure reading stays this high, what should I do next?",
    );
  if (bmiCategory === "Underweight")
    questions.unshift(
      "Is my weight healthy for me, and should anything be checked to understand it?",
    );
  if (
    inputs.systolic !== undefined &&
    inputs.diastolic !== undefined &&
    (inputs.systolic >= 140 || inputs.diastolic >= 90)
  )
    questions.unshift(
      "How should I confirm whether my blood pressure is persistently high?",
    );
  if (glucose && glucose.category !== "Below common screening cutoff")
    questions.push(
      "How should I understand this blood sugar test and whether any follow-up is right for me?",
    );
  if (inputs.systolic === undefined || inputs.diastolic === undefined)
    questions.unshift(
      "Would a properly measured blood-pressure reading add useful context, and how should I obtain one?",
    );
  return [...new Set(questions)].slice(0, 5);
}

function actionPlan(inputs: ValidatedInputs): string[] {
  if (
    inputs.pregnantOrBreastfeeding === "pregnant" ||
    inputs.pregnantOrBreastfeeding === "breastfeeding"
  ) {
    return [
      "Keep rest and hydration as manageable and appropriate for you.",
      "Bring any repeated measurements or new symptoms to your pregnancy-care team.",
      "Use your care team’s personal guidance; general targets may not fit pregnancy or breastfeeding.",
    ];
  }
  const ranked: Array<{ priority: number; text: string }> = [];
  const recommendedSleepMax = inputs.age >= 65 ? 8 : 9;
  if (
    inputs.sleepHours < 7 ||
    inputs.sleepHours > recommendedSleepMax ||
    inputs.wakeUnrefreshed
  ) {
    ranked.push({
      priority: 100 - inputs.sleepHours * 5,
      text: inputs.shiftWorkerOrNewParent
        ? "Look for one small, realistic rest opportunity that fits your shift or caregiving schedule."
        : "Try a steady wind-down or wake-up time that fits your schedule.",
    });
  }
  if (inputs.activityMinutes === 0) {
    ranked.push({
      priority: 75 - inputs.activityMinutes / 5,
      text: "If appropriate for your care plan, consider a little comfortable movement. Do not push through symptoms or increase activity if it makes your symptoms worse; discuss this with a clinician.",
    });
  }
  if (
    inputs.waterGlasses !== undefined &&
    !inputs.conditions.includes("kidneyDisease") &&
    !inputs.conditions.includes("heartDisease")
  ) {
    ranked.push({
      priority: 65 - inputs.waterGlasses * 4,
      text: "Water-glass counts alone cannot establish hydration; food and other drinks also supply fluid. Follow any prescribed fluid limit instead of increasing fluids based on this check-in.",
    });
  }
  if (inputs.caffeineCups !== undefined && inputs.caffeineCups >= 4) {
    ranked.push({
      priority: 55 + inputs.caffeineCups,
      text: "Notice when you have caffeine; if it affects your sleep, consider having it earlier.",
    });
  }
  if (inputs.stress !== undefined && inputs.stress >= 4) {
    ranked.push({
      priority: 60 + inputs.stress,
      text: "Try a brief pause or a slow breathing break during a busy part of the day.",
    });
  }
  if (inputs.sittingHours !== undefined && inputs.sittingHours >= 9) {
    ranked.push({
      priority: 50 + inputs.sittingHours,
      text: "If comfortable, stand, stretch, or move gently during one or two breaks.",
    });
  }
  if (inputs.bpReadingCount > 0 && inputs.measurementContext) {
    ranked.push({
      priority: 85,
      text: "If you repeat your blood pressure, rest quietly first and use the same arm and a correctly sized validated cuff.",
    });
  }
  const selected = ranked
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(({ text }) => text);
  if (selected.length === 0)
    selected.push(
      "Keep the routines that feel sustainable for you, and check in with how you feel over time.",
    );
  return selected;
}

function fatigueReasons(
  inputs: ValidatedInputs,
  bmiCategory: BMICategory,
): string[] {
  const reasons: Array<{ rank: number; text: string }> = [];
  const recommendedSleepMax = inputs.age >= 65 ? 8 : 9;
  if (inputs.sleepHours < 7)
    reasons.push({
      rank: 100 - inputs.sleepHours * 2,
      text: `Your average sleep was ${inputs.sleepHours} hours a night, below the usual adult range.`,
    });
  if (inputs.sleepHours > recommendedSleepMax)
    reasons.push({
      rank: 85,
      text: `You reported ${inputs.sleepHours} hours a night; longer sleep can sometimes go along with low energy.`,
    });
  if (
    inputs.wakeUnrefreshed ||
    inputs.snores ||
    inputs.wakeUps ||
    (inputs.sleepQuality !== undefined && inputs.sleepQuality <= 2)
  ) {
    reasons.push({
      rank: 96,
      text: "The sleep-quality details you checked may matter, even when the hours seem adequate.",
    });
  }
  if (inputs.activityMinutes !== undefined)
    reasons.push({
      rank: 63,
      text: `You reported ${inputs.activityMinutes} minutes of activity per week. Intensity was not recorded, so this number alone cannot show whether moderate/vigorous activity recommendations are met or explain tiredness.`,
    });
  if (inputs.sittingHours !== undefined && inputs.sittingHours >= 9)
    reasons.push({
      rank: 44,
      text: `You reported about ${inputs.sittingHours} sitting hours a day; long sitting stretches can affect how energetic you feel.`,
    });
  if (inputs.stress !== undefined)
    reasons.push({
      rank: 74,
      text: `You rated stress ${inputs.stress} out of 5 on this check-in’s informal scale. Stress can affect rest; this rating is not a mental-health diagnosis.`,
    });
  if (inputs.mood !== undefined && inputs.mood <= 2)
    reasons.push({
      rank: 60,
      text: `You rated mood ${inputs.mood} out of 5; how we feel emotionally can be linked with energy.`,
    });
  if (
    inputs.restingHeartRate !== undefined &&
    (inputs.restingHeartRate > 100 || inputs.restingHeartRate < 50)
  ) {
    reasons.push({
      rank: 50,
      text: `Your resting heart rate was ${inputs.restingHeartRate} bpm; a repeat reading and how you feel are useful context.`,
    });
  }
  if (bmiCategory === "Underweight") {
    reasons.push({
      rank: 90,
      text: "Your BMI is in the underweight range; low body weight can go along with low energy and is worth discussing with a doctor.",
    });
  } else if (
    inputs.age >= 65 ||
    inputs.symptoms.includes("unexplainedWeightChange")
  ) {
    reasons.push({
      rank: 57,
      text: "Unintentional weight change can be useful to discuss with a doctor, especially if your energy is low.",
    });
  }
  if (inputs.caffeineCups !== undefined && inputs.caffeineCups >= 4)
    reasons.push({
      rank: 30,
      text: `You reported ${inputs.caffeineCups} cups of caffeine a day; its timing can sometimes affect sleep.`,
    });
  if (inputs.symptoms.includes("afternoonCrash"))
    reasons.push({
      rank: 35,
      text: "You noted an afternoon energy dip; sleep, routine, and other factors may contribute.",
    });
  if (reasons.length === 0)
    reasons.push({
      rank: 10,
      text: "Your optional details do not point to a clear lifestyle factor; this brief check-in cannot identify every reason for tiredness.",
    });
  return reasons
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 5)
    .map(({ text }) => text);
}

export function buildWellnessReport(inputs: ValidatedInputs): WellnessReport {
  const bp: WellnessReport["bp"] =
    inputs.systolic !== undefined && inputs.diastolic !== undefined
      ? classifyBP(inputs.systolic, inputs.diastolic)
      : {
          value: undefined,
          category: "Not assessed",
          note: "Blood pressure was not entered, so this report cannot assess high or low BP. No reading has been inferred from your other details.",
          tip: "A properly measured BP reading would add screening context and BP-specific safety checks. Ask a healthcare professional how and when to measure it; symptoms still need attention without a reading.",
        };
  const pregnancy =
    inputs.pregnantOrBreastfeeding === "pregnant" ||
    inputs.pregnantOrBreastfeeding === "breastfeeding";
  const bmi = pregnancy
    ? {
        value: 0,
        category: "Not assessed" as BMICategory,
        note: "BMI is not assessed during pregnancy or breastfeeding in this tool.",
        tip: "Your pregnancy or breastfeeding care team can advise on what measures are right for you.",
      }
    : classifyBMI(inputs.weightKg, inputs.heightCm, inputs.region);
  const waistRatio =
    inputs.waistCm !== undefined &&
    !pregnancy &&
    inputs.weightKg / (inputs.heightCm / 100) ** 2 < 35
      ? waistHeightRatio(inputs.waistCm, inputs.heightCm)
      : undefined;
  const sleep = classifySleep(inputs.sleepHours, inputs.age);
  const heartRate =
    inputs.restingHeartRate === undefined
      ? undefined
      : classifyHeartRate(inputs.restingHeartRate, inputs.muscularBuild);
  const glucose = classifyGlucose(inputs.glucose, inputs);
  const context = checkInContext(inputs);
  const safety = getSafetyFlags(inputs);
  if (glucose?.category === "At or above a common screening threshold")
    safety.medicalReview = true;
  // WHO severe thinness (BMI < 16) warrants a clinical conversation on its own.
  if (bmi.category === "Underweight" && bmi.value < 16)
    safety.medicalReview = true;
  if (inputs.age < 20 && bmi.category !== "Not assessed" && !pregnancy)
    bmi.note +=
      " At ages 18–19, clinicians sometimes use BMI-for-age percentiles instead of adult cut-offs; adult cut-offs are used here as a screening reference.";
  const severeReading = inputs.bloodPressureReadings.find(
    ({ systolic, diastolic }) => systolic > 180 || diastolic > 120,
  );
  if (severeReading) {
    bp.note = `One entered blood-pressure reading (${formatMeasurement(severeReading.systolic)}/${formatMeasurement(severeReading.diastolic)} mmHg) is above 180 systolic or 120 diastolic. If you have no concerning symptoms, wait at least one minute and repeat it. If it remains this high, contact a healthcare professional as soon as possible.`;
    bp.tip =
      "If chest pain, shortness of breath, back pain, numbness, weakness, confusion, a severe headache, vision changes, or difficulty speaking occurs, call your local emergency number now.";
  }
  if (inputs.conditions.length > 0 || inputs.medication === "yes") {
    bp.note +=
      " Your doctor’s personal targets may differ; medicines can also affect blood pressure and heart rate.";
    if (inputs.medication === "yes")
      bp.note +=
        " Some medicines, including beta-blockers or blood-pressure medicines, may change heart-rate or blood-pressure readings.";
  }
  if (inputs.bpReadingCount === 1)
    bp.note += " This report reflects one entered reading.";
  if (inputs.measurementContext)
    bp.note += ` You noted this measurement context: ${inputs.measurementContext}.`;
  if (inputs.snores && inputs.wakeUnrefreshed) {
    sleep.note +=
      " Waking unrefreshed and snoring can be worth discussing with a doctor if it continues; this tool cannot assess why.";
  }
  const status: WellnessReport["status"] = safety.urgent
    ? "Urgent"
    : safety.medicalReview
      ? "Talk to a doctor soon"
      : bp.category === "Stage 2" ||
          glucose?.category === "At or above a common screening threshold"
        ? "Talk to a doctor soon"
        : (bp.category !== "Not assessed" && bp.category !== "Normal") ||
            sleep.category !== "Recommended range" ||
            (heartRate !== undefined &&
              heartRate.category !== "Usual range" &&
              heartRate.category !== "Below 60, often normal") ||
            bmi.category === "Underweight" ||
            bmi.category === "Obese" ||
            bmi.category === "High risk" ||
            ((bmi.category === "Overweight" ||
              bmi.category === "Increased risk") &&
              !inputs.muscularBuild) ||
            glucose?.category === "Common increased-risk screening range"
          ? "Some things to watch"
          : "No automatic flags";
  const summary =
    status === "No automatic flags"
      ? "No automatic flags were found in the ranges this tool checks. This does not mean you are healthy or rule out illness. Symptoms and your clinician’s advice take priority."
      : status === "Some things to watch"
        ? "A few of your numbers or sleep details may be worth watching over time. One check-in cannot tell the whole story."
        : status === "Talk to a doctor soon"
          ? "Given what you shared, a conversation with a doctor could help you decide what to check next."
          : "Please focus on getting timely care before reviewing the rest of these results.";
  return {
    inputs,
    bp,
    bloodType: bloodTypeContext(inputs),
    bmi,
    waistToHeightRatio: waistRatio,
    sleep,
    heartRate,
    glucose,
    context,
    safety,
    status,
    summary,
    actions:
      safety.urgent ||
      safety.crisisBloodPressure ||
      safety.glucoseConcern ||
      safety.selfHarmConcern ||
      safety.disorderedEatingConcern
        ? []
        : actionPlan(inputs),
    fatigueReasons: fatigueReasons(inputs, bmi.category),
    doctorQuestions: doctorQuestions(inputs, glucose, bmi.category),
  };
}

export function reportDisclaimer(): string {
  return DISCLAIMER;
}
