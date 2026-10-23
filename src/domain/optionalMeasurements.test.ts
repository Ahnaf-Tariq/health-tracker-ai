import { describe, expect, it } from "@jest/globals";
import { BLOOD_TYPES, type FormData } from "./types";
import { emptyForm, validateForm } from "./validation";
import { buildWellnessReport, previewSafety } from "./rules";
import { buildReportText } from "../lib/summary";

const form = (changes: Partial<FormData> = {}): FormData => ({
  ...emptyForm(),
  age: "35",
  sexAtBirth: "prefer-not-to-say",
  height: "170",
  weight: "70",
  sleepHours: "8",
  ...changes,
});
function report(changes: Partial<FormData> = {}) {
  const validated = validateForm(form(changes));
  expect(validated.errors).toEqual({});
  expect(validated.ok).toBe(true);
  return buildWellnessReport(validated.inputs!);
}

describe("optional blood pressure and evidence-limited blood type", () => {
  it("accepts an empty BP row without guessing a normal or zero measurement", () => {
    const result = report();
    expect(result.inputs.systolic).toBeUndefined();
    expect(result.inputs.diastolic).toBeUndefined();
    expect(result.inputs.bpReadingCount).toBe(0);
    expect(result.inputs.bloodPressureReadings).toEqual([]);
    expect(result.bp.category).toBe("Not assessed");
    expect(result.bp.value).toBeUndefined();
    expect(result.status).toBe("No automatic flags");
    expect(result.safety.abnormalVitals).toBe(false);
    expect(result.context.bloodPressureMissing).toBe(true);
    expect(result.context.bloodPressureNote).toContain("Confidence: lower");
    expect(result.context.bloodPressureNote).toContain(
      "BP-specific safety checks",
    );
    const text = buildReportText(result);
    expect(text).toContain("Blood pressure: Not entered — Not assessed");
    expect(text).not.toMatch(/undefined|NaN|0 \/ 0/);
  });
  it("supports no rows, extra blank rows and a later complete row", () => {
    expect(report({ readings: [] }).bp.category).toBe("Not assessed");
    expect(
      report({
        readings: [
          { systolic: "", diastolic: "" },
          { systolic: "", diastolic: "" },
        ],
      }).inputs.bpReadingCount,
    ).toBe(0);
    const result = report({
      readings: [
        { systolic: "", diastolic: "" },
        { systolic: "140", diastolic: "90" },
      ],
    });
    expect(result.inputs.bpReadingCount).toBe(1);
    expect(result.bp.category).toBe("Stage 2");
    expect(result.context.bloodPressureMissing).toBe(false);
    expect(result.context.bloodPressureNote).toBeUndefined();
  });
  it.each([
    { systolic: "120", diastolic: "" },
    { systolic: "", diastolic: "80" },
    { systolic: "x", diastolic: "80" },
  ])("does not silently discard a partial/invalid reading %j", (reading) => {
    expect(validateForm(form({ readings: [reading] })).ok).toBe(false);
  });
  it("keeps partial severe-reading warnings and symptom safety independent of optional BP", () => {
    expect(
      previewSafety(form({ readings: [{ systolic: "220", diastolic: "" }] }))
        .crisisBloodPressure,
    ).toBe(true);
    expect(report({ symptoms: ["speechChanges"] }).safety.urgent).toBe(true);
    expect(
      report({
        pregnantOrBreastfeeding: "pregnant",
        symptoms: ["visionChanges"],
      }).safety.urgent,
    ).toBe(true);
    expect(report({ fatigueTwoWeeks: true }).safety.medicalReview).toBe(true);
  });
  it("retains useful BMI, sleep, activity, stress and symptom context without BP", () => {
    const result = report({
      sleepHours: "6",
      activityMinutes: "100",
      stress: "4",
      symptoms: ["afternoonCrash"],
    });
    expect(result.bmi.value).toBeCloseTo(24.22, 2);
    expect(result.sleep.category).toBe("Borderline");
    expect(result.fatigueReasons.join(" ")).toMatch(/100 minutes/);
    expect(result.fatigueReasons.join(" ")).toMatch(/stress 4 out of 5/);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.doctorQuestions.join(" ")).toContain(
      "blood-pressure reading",
    );
  });
  it.each(BLOOD_TYPES)(
    "records %s without inventing a disease prediction or changing clinical thresholds",
    (bloodType) => {
      const baseline = report();
      const result = report({ bloodType });
      expect(result.bloodType?.value).toBe(bloodType);
      expect(result.bloodType?.note).toContain("no validated method");
      expect(result.status).toBe(baseline.status);
      expect(result.safety).toEqual(baseline.safety);
      expect(result.actions).toEqual(baseline.actions);
      expect(result.bmi).toEqual(baseline.bmi);
      expect(result.bp).toEqual(baseline.bp);
      expect(buildReportText(result)).toContain(
        `Blood type: ${bloodType} (self-reported)`,
      );
    },
  );
  it("allows skipped/unknown blood type and rejects an unsupported value", () => {
    expect(report().bloodType).toBeUndefined();
    expect(report({ bloodType: "unknown" }).bloodType?.value).toBe("unknown");
    expect(
      validateForm(form({ bloodType: "A1" as FormData["bloodType"] })).errors
        .bloodType,
    ).toBeDefined();
    expect(report().context.missingInputs).not.toContain("Blood type");
  });
  it.each(["A-", "B-", "AB-", "O-"] as const)(
    "adds Rh-negative pregnancy context for %s without diagnosing incompatibility",
    (bloodType) => {
      const result = report({ bloodType, pregnantOrBreastfeeding: "pregnant" });
      expect(result.bloodType?.maternityNote).toContain("RhD-negative");
      expect(result.bloodType?.maternityNote).toContain("antibody screening");
      expect(result.bloodType?.maternityNote).toContain(
        "does not establish incompatibility",
      );
      expect(result.safety.urgent).toBe(false);
      expect(result.bloodType?.tip).toContain(
        "must never be used to choose blood",
      );
    },
  );
  it("does not promise antibody safety for Rh-positive or unknown pregnancy groups", () => {
    for (const bloodType of ["O+", "unknown"] as const)
      expect(
        report({ bloodType, pregnantOrBreastfeeding: "pregnant" }).bloodType
          ?.maternityNote,
      ).toContain("cannot establish your baby’s type or rule out");
  });
});
