import { describe, expect, it } from "@jest/globals";
import { buildWellnessReport } from "./rules";
import { calculateCheckInScore } from "./checkInScore";
import type { ValidatedInputs } from "./types";

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
const score = (overrides: Partial<ValidatedInputs> = {}) =>
  calculateCheckInScore(buildWellnessReport({ ...base, ...overrides }));
const points = (
  result: ReturnType<typeof calculateCheckInScore>,
  label: string,
) => result.breakdown.find((item) => item.label === label)?.points;

describe("calculateCheckInScore", () => {
  it("returns 100 when every entered check is in its reference range", () => {
    const result = score();
    expect(result.value).toBe(100);
    expect(result.assessedChecks).toBe(3);
    expect(result.breakdown.map((item) => item.label)).toEqual([
      "BMI",
      "Blood pressure",
      "Sleep",
    ]);
  });

  it("scores the 19-year-old example from graded points", () => {
    const result = score({
      age: 19,
      heightCm: 165.1,
      weightKg: 45,
      systolic: 140,
      diastolic: 67,
      bloodPressureReadings: [{ systolic: 140, diastolic: 67 }],
      sleepHours: 5,
      restingHeartRate: 56,
    });
    expect(points(result, "BMI")).toBe(60);
    expect(points(result, "Blood pressure")).toBe(58);
    expect(points(result, "Sleep")).toBe(68);
    expect(points(result, "Resting heart rate")).toBe(95);
    expect(result.assessedChecks).toBe(4);
    expect(result.value).toBe(70);
  });

  it("scores thinner BMI values lower than milder ones", () => {
    const mild = points(score({ weightKg: 53, heightCm: 170 }), "BMI"); // 18.3
    const moderate = points(score({ weightKg: 48, heightCm: 170 }), "BMI"); // 16.6
    const severe = points(score({ weightKg: 40, heightCm: 170 }), "BMI"); // 13.8
    expect(mild).toBeGreaterThan(moderate as number);
    expect(moderate).toBeGreaterThan(severe as number);
    expect(severe).toBeGreaterThan(0);
  });

  it("scores shorter sleep lower, in graded steps", () => {
    const hours = [8, 6.5, 5, 4.5, 3];
    const values = hours.map((sleepHours) =>
      points(score({ sleepHours }), "Sleep"),
    ) as number[];
    expect(values).toEqual([100, 85, 68, 50, 35]);
  });

  it("scores a resting rate of 50–59 close to normal and below 50 lower", () => {
    const rate = (restingHeartRate: number) =>
      points(score({ restingHeartRate }), "Resting heart rate");
    expect(rate(72)).toBe(100);
    expect(rate(56)).toBe(95);
    expect(rate(45)).toBe(80);
    expect(rate(105)).toBe(85);
    expect(rate(125)).toBe(60);
  });

  it("scores higher blood pressure stages lower and severe stage 2 lowest before crisis", () => {
    const bp = (systolic: number, diastolic: number) =>
      points(
        score({
          systolic,
          diastolic,
          bloodPressureReadings: [{ systolic, diastolic }],
        }),
        "Blood pressure",
      );
    expect(bp(119, 79)).toBe(100);
    expect(bp(125, 79)).toBe(88);
    expect(bp(135, 79)).toBe(75);
    expect(bp(145, 85)).toBe(58);
    expect(bp(165, 85)).toBe(42);
  });

  it("does not penalize unentered optional checks", () => {
    const withoutBP = score({
      systolic: undefined,
      diastolic: undefined,
      bloodPressureReadings: [],
      bpReadingCount: 0,
    });
    expect(withoutBP.value).toBe(100);
    expect(withoutBP.assessedChecks).toBe(2);
    expect(score().assessedChecks).toBe(3);
  });

  it("excludes glucose values that the existing rules show without interpretation", () => {
    const result = score({
      glucose: {
        value: 5.4,
        unit: "mmol/L",
        testType: "other",
        fastingConfirmed: false,
      },
    });
    expect(result.value).toBe(100);
    expect(result.assessedChecks).toBe(3);
  });

  it("caps the estimate at 60 for a crisis-range blood pressure reading", () => {
    const result = score({
      systolic: 181,
      diastolic: 121,
      bloodPressureReadings: [{ systolic: 181, diastolic: 121 }],
    });
    expect(points(result, "Blood pressure")).toBe(25);
    expect(result.value).toBe(60);
  });

  it("caps the estimate at 60 for a low glucose safety reading", () => {
    const result = score({
      glucose: {
        value: 45,
        unit: "mg/dL",
        testType: "other",
        fastingConfirmed: false,
      },
    });
    expect(points(result, "Blood sugar")).toBe(30);
    expect(result.value).toBe(60);
  });

  it("is deterministic and stays within 0–100", () => {
    const worst = score({
      weightKg: 30,
      sleepHours: 2,
      restingHeartRate: 130,
      systolic: 200,
      diastolic: 130,
      bloodPressureReadings: [{ systolic: 200, diastolic: 130 }],
    });
    expect(worst).toEqual(
      score({
        weightKg: 30,
        sleepHours: 2,
        restingHeartRate: 130,
        systolic: 200,
        diastolic: 130,
        bloodPressureReadings: [{ systolic: 200, diastolic: 130 }],
      }),
    );
    expect(worst.value).toBeGreaterThanOrEqual(0);
    expect(worst.value).toBeLessThanOrEqual(100);
  });
});
