import { describe, expect, it } from "@jest/globals";
import { classifyGlucose } from "./clinicalGuidance";
import {
  buildWellnessReport,
  classifyBP,
  classifyHeartRate,
  getSafetyFlags,
  previewSafety,
  waistHeightRatio,
} from "./rules";
import { emptyForm, validateForm } from "./validation";
import { formatMeasurement } from "./format";
import { buildReportText } from "../lib/summary";
import type { GlucoseMeasurement, ValidatedInputs } from "./types";

const base: ValidatedInputs = {
  age: 35,
  sexAtBirth: "prefer-not-to-say",
  heightCm: 170,
  weightKg: 70,
  systolic: 119,
  diastolic: 79,
  bloodPressureReadings: [{ systolic: 119, diastolic: 79 }],
  bpReadingCount: 1,
  sleepHours: 8,
  wakeUps: false,
  snores: false,
  wakeUnrefreshed: false,
  fatigueTwoWeeks: false,
  region: "other",
  muscularBuild: false,
  conditions: [],
  symptoms: [],
  notes: "",
  shiftWorkerOrNewParent: false,
  measurementContext: "",
};
const glucose = (
  value: number,
  unit: "mg/dL" | "mmol/L" = "mg/dL",
): GlucoseMeasurement => ({
  value,
  unit,
  testType: "fasting",
  fastingConfirmed: true,
});

describe("2026-10-15 medical audit regressions", () => {
  it("keeps threshold values unrounded and identifies approximate display values", () => {
    expect(formatMeasurement(180.1)).toBe("180.1");
    expect(formatMeasurement(180.001)).toBe("~180");
    expect(classifyBP(119.999, 79).category).toBe("Normal");
    expect(formatMeasurement(119.999)).toBe("~120");
  });
  it.each([50, 55, 59])(
    "does not call %d bpm the usual 60–100 reference",
    (bpm) => {
      expect(classifyHeartRate(bpm, false).category).toBe(
        "Below 60, often normal",
      );
      expect(classifyHeartRate(bpm, true).category).toBe(
        "Below 60, often normal",
      );
      expect(classifyHeartRate(bpm, false).category).not.toBe("Usual range");
    },
  );
  it("does not label hypotension as normal or reassuring", () => {
    expect(classifyBP(85, 55).category).toBe("Low reading");
    expect(
      buildWellnessReport({ ...base, systolic: 85, diastolic: 55 }).status,
    ).toBe("Some things to watch");
  });
  it.each([
    "speechChanges",
    "confusion",
    "numbness",
    "weakness",
    "headache",
    "visionChanges",
    "chestDiscomfort",
    "shortnessOfBreath",
  ] as const)(
    "does not gate %s safety guidance on abnormal blood pressure",
    (symptom) => {
      const report = buildWellnessReport({ ...base, symptoms: [symptom] });
      expect(report.safety.urgent).toBe(true);
      expect(report.actions).toHaveLength(0);
      expect(buildReportText(report)).toContain(
        "call your local emergency number now",
      );
    },
  );
  it.each(["pregnant", "breastfeeding"] as const)(
    "uses maternity safety context for %s without needing other symptoms",
    (context) => {
      expect(
        getSafetyFlags({
          ...base,
          pregnantOrBreastfeeding: context,
          systolic: 160,
        }).urgent,
      ).toBe(true);
      expect(
        getSafetyFlags({
          ...base,
          pregnantOrBreastfeeding: context,
          diastolic: 110,
        }).urgent,
      ).toBe(true);
      expect(
        getSafetyFlags({
          ...base,
          pregnantOrBreastfeeding: context,
          symptoms: ["headache"],
        }).urgent,
      ).toBe(true);
    },
  );
  it.each([4, 6, 8, 10])(
    "flags ongoing unexplained fatigue even with %d hours of sleep",
    (sleepHours) => {
      expect(
        buildWellnessReport({ ...base, sleepHours, fatigueTwoWeeks: true })
          .safety.medicalReview,
      ).toBe(true);
    },
  );
  it.each([
    [69, "mg/dL", "Low glucose reading"],
    [70, "mg/dL", "Below common screening cutoff"],
    [3.89, "mmol/L", "Low glucose reading"],
    [3.9, "mmol/L", "Below common screening cutoff"],
    [299, "mg/dL", "At or above a common screening threshold"],
    [300, "mg/dL", "Very high glucose reading"],
    [16.7, "mmol/L", "Very high glucose reading"],
  ] as const)(
    "gives %d %s appropriate safety context",
    (value, unit, category) => {
      expect(classifyGlucose(glucose(value, unit), base)?.category).toBe(
        category,
      );
    },
  );
  it("does not hide glucose safety flags behind pregnancy, diabetes, fasting or meter exclusions", () => {
    for (const context of [
      base,
      { ...base, conditions: ["diabetes"] as const },
      { ...base, pregnantOrBreastfeeding: "pregnant" as const },
    ]) {
      const inputs = {
        ...base,
        ...context,
        conditions: [...context.conditions],
        glucose: {
          ...glucose(45),
          testType: "other" as const,
          fastingConfirmed: false,
        },
      };
      const report = buildWellnessReport(inputs);
      expect(report.glucose?.category).toBe("Low glucose reading");
      expect(report.safety.glucoseConcern).toBe(true);
      expect(report.actions).toHaveLength(0);
      const text = buildReportText(report);
      expect(text).toContain("GLUCOSE SAFETY GUIDANCE");
      expect(text).toContain("swallow safely");
    }
  });
  it("never interprets HbA1c percentage as a current low-glucose event", () => {
    const report = buildWellnessReport({
      ...base,
      glucose: {
        value: 5,
        unit: "%",
        testType: "hba1c",
        fastingConfirmed: false,
      },
    });
    expect(report.safety.glucoseConcern).toBe(false);
    expect(
      classifyGlucose(
        { value: 6.8, unit: "%", testType: "hba1c", fastingConfirmed: false },
        { conditions: ["kidneyDisease"] },
      )?.category,
    ).toBe("Shown without interpretation");
  });
  it("allows a dangerous wide pulse pressure to reach safety handling", () => {
    const form = {
      ...emptyForm(),
      age: "35",
      sexAtBirth: "prefer-not-to-say" as const,
      height: "170",
      weight: "70",
      sleepHours: "8",
      readings: [{ systolic: "220", diastolic: "60" }],
    };
    const validation = validateForm(form);
    expect(validation.ok).toBe(true);
    expect(
      buildWellnessReport(validation.inputs!).safety.crisisBloodPressure,
    ).toBe(true);
  });
  it("shows safety signals before unrelated required fields are completed", () => {
    expect(
      previewSafety({
        ...emptyForm(),
        readings: [{ systolic: "220", diastolic: "" }],
      }).crisisBloodPressure,
    ).toBe(true);
    expect(
      previewSafety({ ...emptyForm(), symptoms: ["speechChanges"] }).urgent,
    ).toBe(true);
    expect(
      previewSafety({
        ...emptyForm(),
        glucoseTestType: "other",
        glucoseValue: "40",
      }).glucoseConcern,
    ).toBe(true);
    expect(previewSafety(emptyForm()).urgent).toBe(false);
  });
  it("compares waist values before rounding and restricts the NICE reference to BMI below 35", () => {
    expect(waistHeightRatio(84.2, 170)).toBeLessThan(0.5);
    expect(waistHeightRatio(85, 170)).toBe(0.5);
    const report = buildWellnessReport({ ...base, waistCm: 84.2 });
    expect(buildReportText(report)).not.toContain("at or above 0.5");
    expect(
      buildWellnessReport({ ...base, weightKg: 110, waistCm: 100 })
        .waistToHeightRatio,
    ).toBeUndefined();
  });
  it("does not convert cups, glass counts or unspecified activity intensity into clinical measurements", () => {
    const report = buildWellnessReport({
      ...base,
      activityMinutes: 100,
      waterGlasses: 2,
      conditions: ["kidneyDisease"],
      caffeineCups: 5,
    });
    expect(report.actions.join(" ")).not.toMatch(
      /sip|drink more|below.*150|dehydrated/i,
    );
    expect(report).not.toHaveProperty("energy");
  });
  it("never exports a numeric energy score, confidence rating or reassurance of health", () => {
    const text = buildReportText(buildWellnessReport(base));
    expect(text).not.toMatch(
      /Energy score: \d|High energy|High confidence|Medium confidence|Confidence:/i,
    );
    expect(text).toContain("No validated energy");
    expect(text).toContain("does not mean you are healthy");
  });
});
