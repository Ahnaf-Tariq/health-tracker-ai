import { CLINICAL_SOURCES, glucoseTestLabel } from "../domain/clinicalGuidance";
import { DISCLAIMER } from "../domain/constants";
import { BLOOD_TYPE_SOURCES } from "../domain/bloodType";
import { formatMeasurement } from "../domain/format";
import type { WellnessReport } from "../domain/types";

const n = formatMeasurement;

function metricLines(
  title: string,
  value: string,
  category: string,
  note: string,
  tip: string,
): string[] {
  return [
    `${title}: ${value} — ${category}`,
    `What this may mean: ${note}`,
    `One helpful tip: ${tip}`,
    "",
  ];
}

export function buildReportText(report: WellnessReport): string {
  const i = report.inputs;
  if (report.safety.urgent) {
    return [
      "HEALTH TRACKER — URGENT",
      "",
      "Seek emergency care / call your local emergency number now.",
      "One or more details you entered can need urgent attention. This tool can’t assess an emergency or tell you the cause.",
      ...report.safety.urgentReasons.map((reason) => `• ${reason}`),
      "",
      "Please do not wait for this app to decide what is happening. Contact local emergency services or go to the nearest emergency department now. Do not drive yourself if you may be having a medical emergency.",
      "",
      DISCLAIMER,
    ].join("\n");
  }

  const bmiCategory =
    report.bmi.category === "Not assessed"
      ? "Pregnancy-specific care"
      : report.bmi.category;
  const bmiValue =
    report.bmi.category === "Not assessed"
      ? "Not assessed"
      : n(report.bmi.value);
  const bmiNote = `${report.bmi.note}${i.muscularBuild ? " A muscular build can also make BMI less informative." : ""}${i.age >= 65 ? " BMI needs cautious interpretation at 65+, including muscle mass, other conditions and overall function." : ""}`;
  const heartRateLines = report.heartRate
    ? metricLines(
        "Resting heart rate",
        `${i.restingHeartRate} bpm`,
        report.heartRate.category,
        report.heartRate.note,
        report.heartRate.tip,
      )
    : metricLines(
        "Resting heart rate",
        "Not entered",
        "Optional",
        "This optional detail was not included, so heart rate cannot be part of the snapshot.",
        "If you have a calm, resting measurement, you can include it in another check-in.",
      );

  const lines = [
    "HEALTH TRACKER — MY WELLNESS CHECK-IN",
    "",
    report.summary,
    `Overall status: ${report.status}`,
    "No validated energy or overall health score is calculated. This check-in cannot diagnose illness or rule out an emergency.",
    "This report uses fixed rules and is calculated in your browser. If you attach it to an AI chat, a sanitized report snapshot and chat history are saved in your Firebase account. Each message and attached context are sent to Google Gemini when you chat. The private safety note is excluded.",
    "Values marked ~ are rounded for display; classifications use unrounded values.",
    ...(report.context.bloodPressureNote
      ? [report.context.bloodPressureNote]
      : []),
    "",
    "THE NUMBERS, IN CONTEXT",
    ...metricLines(
      "Blood pressure",
      i.systolic !== undefined && i.diastolic !== undefined
        ? `${n(i.systolic)} / ${n(i.diastolic)} mmHg`
        : "Not entered",
      report.bp.category,
      report.bp.note,
      report.bp.tip,
    ),
    ...metricLines(
      "BMI & waist",
      bmiValue,
      bmiCategory,
      bmiNote,
      report.bmi.tip,
    ),
    ...metricLines(
      "Sleep",
      `${n(i.sleepHours)} hours/night`,
      report.sleep.category,
      report.sleep.note,
      report.sleep.tip,
    ),
    ...heartRateLines,
  ];

  if (report.bloodType)
    lines.push(
      "BLOOD TYPE CONTEXT",
      `Blood type: ${report.bloodType.value === "unknown" ? "Unknown" : report.bloodType.value} (self-reported)`,
      report.bloodType.note,
      ...(report.bloodType.maternityNote
        ? [report.bloodType.maternityNote]
        : []),
      report.bloodType.tip,
      "",
    );

  if (report.glucose && i.glucose) {
    lines.push(
      ...metricLines(
        "Blood sugar test",
        `${glucoseTestLabel(i.glucose.testType)}: ${n(i.glucose.value)} ${i.glucose.unit}`,
        report.glucose.category,
        report.glucose.note,
        report.glucose.tip,
      ),
    );
  }
  if (report.safety.crisisBloodPressure) {
    lines.push("BLOOD-PRESSURE FOLLOW-UP", report.bp.note, report.bp.tip, "");
  }
  if (report.waistToHeightRatio !== undefined) {
    lines.push(
      `Waist-to-height ratio: ${formatMeasurement(report.waistToHeightRatio, 3)}. ${
        report.waistToHeightRatio >= 0.5
          ? "This is at or above 0.5, a signal that can be worth discussing. Waist measurements can add context beyond BMI."
          : "This is one way to put waist size into context. It is not a diagnosis."
      }`,
      "",
    );
  }
  if (
    i.pregnantOrBreastfeeding !== "pregnant" &&
    i.pregnantOrBreastfeeding !== "breastfeeding"
  ) {
    lines.push(
      "BMI can be misleading for athletes or very muscular people, older adults who have lost muscle, and during pregnancy. It is only one rough measure.",
      "",
    );
  }
  if (i.snores && i.wakeUnrefreshed) {
    lines.push(
      "Sleep-quality context: Your hours may look adequate, but snoring and waking unrefreshed may point to poor-quality sleep. Consider discussing this with a doctor if it continues.",
      "",
    );
  }
  if (
    i.pregnantOrBreastfeeding === "pregnant" ||
    i.pregnantOrBreastfeeding === "breastfeeding"
  ) {
    lines.push(
      "Pregnancy and breastfeeding can change what measurements mean. BMI is not assessed here; your care team can offer advice that fits you.",
      "",
    );
  }
  if (i.conditions.length || i.medication === "yes") {
    lines.push(
      "Personal targets: Your doctor’s personal targets may differ. Some medicines can also change blood-pressure or heart-rate readings.",
      "",
    );
  }
  if (report.safety.disorderedEatingConcern) {
    lines.push(
      "YOU DESERVE SUPPORT",
      "Be gentle with yourself. Worries about food or your body can feel heavy. You don’t have to manage that alone; consider talking with a health professional or someone you trust. This report does not set diet, weight, or calorie targets.",
      "",
    );
  }
  if (report.safety.medicalReview) {
    lines.push(
      "A GENTLE NEXT STEP",
      "Consider checking in with a doctor. It may help to talk through how you’ve been feeling and what these readings mean for you. Some checks doctors may consider include a blood count, thyroid, or blood sugar. This is a conversation starter—not a conclusion.",
      "",
    );
  }
  if (i.hemoglobin !== undefined || i.cholesterol) {
    lines.push(
      "OTHER LAB VALUES YOU ENTERED",
      "Values are shown as supplied and are not interpreted here. A clinician can help explain them.",
    );
    if (i.hemoglobin !== undefined)
      lines.push(`Hemoglobin: ${n(i.hemoglobin)} g/dL`);
    if (i.cholesterol)
      lines.push(
        `Cholesterol: ${n(i.cholesterol.value)} ${i.cholesterol.unit}`,
      );
    lines.push("");
  }
  if (report.context.missingInputs.length) {
    lines.push(
      "Optional details not entered: " +
        report.context.missingInputs.join(", ") +
        ". More data does not establish medical accuracy or diagnostic confidence.",
      "",
    );
  }
  if (report.safety.glucoseConcern && report.glucose) {
    lines.push(
      "GLUCOSE SAFETY GUIDANCE",
      report.glucose.note,
      report.glucose.tip,
      "",
    );
  }

  lines.push(
    "YOUR 7-DAY ACTION PLAN",
    ...(report.actions.length
      ? report.actions.slice(0, 5).map((action) => `• ${action}`)
      : report.safety.crisisBloodPressure || report.safety.glucoseConcern
        ? [
            "• No routine suggestions are shown while a potentially unsafe reading needs follow-up. Follow the safety guidance above.",
          ]
        : report.safety.disorderedEatingConcern
          ? [
              "• No food, diet, or weight-focused actions are shown. You deserve support without numbers or pressure.",
            ]
          : [
              "• No general action suggestions are included based on this check-in.",
            ]),
    "No medication, supplement, extreme-diet, or calorie-target advice is included.",
    "",
    "TOPICS TO DISCUSS ABOUT TIREDNESS",
    ...report.fatigueReasons.slice(0, 5).map((reason) => `• ${reason}`),
    "These are discussion topics, not established causes or a complete assessment.",
    "",
    "QUESTIONS TO ASK YOUR DOCTOR",
    ...report.doctorQuestions.slice(0, 5).map((question) => `• ${question}`),
    "",
    "CLINICAL REFERENCES",
    "These sources inform some screening ranges and safety messages. They do not make this tool a medical assessment.",
    ...[...CLINICAL_SOURCES, ...BLOOD_TYPE_SOURCES].map(
      (source) => `• ${source.name}: ${source.url}`,
    ),
    "",
    DISCLAIMER,
  );
  return lines.join("\n");
}
