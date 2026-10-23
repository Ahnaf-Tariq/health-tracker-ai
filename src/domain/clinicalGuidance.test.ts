import { describe, expect, it } from "@jest/globals";
import { classifyGlucose } from "./clinicalGuidance";
import type { GlucoseMeasurement, ValidatedInputs } from "./types";

const context = { conditions: [], pregnantOrBreastfeeding: undefined } as Pick<
  ValidatedInputs,
  "conditions" | "pregnantOrBreastfeeding"
>;
const sample = (
  value: number,
  testType: GlucoseMeasurement["testType"],
  unit: GlucoseMeasurement["unit"],
  fastingConfirmed = true,
): GlucoseMeasurement => ({ value, testType, unit, fastingConfirmed });

describe("source-based glucose screening context (not diagnosis)", () => {
  it.each([
    [99.9, "Below common screening cutoff"],
    [100, "Common increased-risk screening range"],
    [125.9, "Common increased-risk screening range"],
    [126, "At or above a common screening threshold"],
  ] as const)("fasting laboratory glucose %d mg/dL → %s", (value, expected) => {
    expect(
      classifyGlucose(sample(value, "fasting", "mg/dL"), context)?.category,
    ).toBe(expected);
  });
  it.each([
    [5.59, "Below common screening cutoff"],
    [5.6, "Common increased-risk screening range"],
    [6.99, "Common increased-risk screening range"],
    [7, "At or above a common screening threshold"],
  ] as const)(
    "fasting laboratory glucose %d mmol/L → %s",
    (value, expected) => {
      expect(
        classifyGlucose(sample(value, "fasting", "mmol/L"), context)?.category,
      ).toBe(expected);
    },
  );
  it.each([
    [5.69, "Below common screening cutoff"],
    [5.7, "Common increased-risk screening range"],
    [6.49, "Common increased-risk screening range"],
    [6.5, "At or above a common screening threshold"],
  ] as const)("laboratory HbA1c %d%% → %s", (value, expected) => {
    expect(
      classifyGlucose(sample(value, "hba1c", "%"), context)?.category,
    ).toBe(expected);
  });
  it("does not apply fasting ranges when an eight-hour fast was not confirmed", () => {
    expect(
      classifyGlucose(sample(130, "fasting", "mg/dL", false), context)
        ?.category,
    ).toBe("Shown without interpretation");
  });
  it("shows home-meter and other results without lab-range interpretation", () => {
    expect(
      classifyGlucose(sample(180, "other", "mg/dL"), context)?.category,
    ).toBe("Shown without interpretation");
  });
  it("avoids generic screening ranges for known diabetes or pregnancy", () => {
    expect(
      classifyGlucose(sample(140, "fasting", "mg/dL"), {
        ...context,
        conditions: ["diabetes"],
      })?.category,
    ).toBe("Shown without interpretation");
    expect(
      classifyGlucose(sample(140, "fasting", "mg/dL"), {
        ...context,
        pregnantOrBreastfeeding: "pregnant",
      })?.category,
    ).toBe("Shown without interpretation");
  });
  it("avoids HbA1c screening interpretation with known anemia", () => {
    expect(
      classifyGlucose(sample(6.8, "hba1c", "%"), {
        ...context,
        conditions: ["anemia"],
      })?.category,
    ).toBe("Shown without interpretation");
  });
  it("uses plain non-diagnostic language for an above-threshold screening result", () => {
    const result = classifyGlucose(sample(126, "fasting", "mg/dL"), context);
    expect(result?.note).toMatch(/cannot diagnose/i);
    expect(result?.note).toMatch(/confirm/i);
  });
});
