import { describe, expect, it } from "@jest/globals";
import { buildWellnessReport } from "../domain/rules";
import { DISCLAIMER } from "../domain/constants";
import {
  buildReportPDF,
  triggerBlobDownload,
  type DownloadEnvironment,
} from "./pdf";
import { buildReportText } from "./summary";
import type { ValidatedInputs } from "../domain/types";

const sample: ValidatedInputs = {
  age: 68,
  sexAtBirth: "prefer-not-to-say",
  heightCm: 172,
  weightKg: 72,
  systolic: 118,
  diastolic: 77,
  bloodPressureReadings: [{ systolic: 118, diastolic: 77 }],
  bpReadingCount: 1,
  sleepHours: 7.5,
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

function extractPdfText(output: string): string {
  return [...output.matchAll(/\(((?:\\[\s\S]|[^\\)])*)\)\s*Tj/g)]
    .map((match) => (match[1] ?? "").replace(/\\([()\\])/g, "$1"))
    .join(" ")
    .replace(/\s+/g, " ");
}

describe("client-side PDF export", () => {
  it("exports missing BP, lower assessment confidence and self-reported Rh pregnancy context without fabricated readings", async () => {
    const report = buildWellnessReport({
      ...sample,
      systolic: undefined,
      diastolic: undefined,
      bloodPressureReadings: [],
      bpReadingCount: 0,
      bloodType: "O-",
      pregnantOrBreastfeeding: "pregnant",
    });
    const pdf = await buildReportPDF(report);
    const text = extractPdfText(pdf.output() as string);
    expect(text).toContain("Blood pressure: Not entered");
    expect(text).toContain("Confidence: lower");
    expect(text).toContain("Blood type: O- (self-reported)");
    expect(text).toContain("RhD-negative");
    expect(text).toContain("antibody screening");
    expect(text).not.toMatch(/NaN|undefined|0 \/ 0 mmHg/);
  });
  it("creates, clicks, and later revokes a browser PDF download link", () => {
    let clicked = false;
    let removed = false;
    let delayed: (() => void) | undefined;
    let filename = "";
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click: () => {
        clicked = true;
      },
      remove: () => {
        removed = true;
      },
    } as unknown as HTMLAnchorElement;
    let revoked = "";
    const environment: DownloadEnvironment = {
      document: {
        createElement: () => anchor,
        body: {
          appendChild: (element: Node) => {
            filename = (element as HTMLAnchorElement).download;
            return element;
          },
        },
      } as unknown as DownloadEnvironment["document"],
      createObjectURL: () => "blob:test-health-tracker",
      revokeObjectURL: (url) => {
        revoked = url;
      },
      defer: (callback) => {
        delayed = callback;
      },
    };
    triggerBlobDownload(
      new Blob(["%PDF-1.4"], { type: "application/pdf" }),
      "health-tracker-wellness-summary.pdf",
      environment,
    );
    expect(clicked).toBe(true);
    expect(removed).toBe(true);
    expect(filename).toBe("health-tracker-wellness-summary.pdf");
    expect(revoked).toBe("");
    delayed?.();
    expect(revoked).toBe("blob:test-health-tracker");
  });

  it("creates a readable PDF containing the complete disclaimer and clinical references", async () => {
    const document = await buildReportPDF(buildWellnessReport(sample));
    const output = document.output() as string;
    expect(output.startsWith("%PDF-")).toBe(true);
    const pdfText = extractPdfText(output);
    expect(pdfText).toContain(DISCLAIMER);
    expect(pdfText).toContain("Health Tracker");
    expect(pdfText).toContain("American Heart Association");
    expect(pdfText).toContain("niddk.nih.gov");
    expect(document.getNumberOfPages()).toBeGreaterThan(0);
  });

  it("pauses the energy score and routine suggestions for a very high, symptom-free blood-pressure reading", async () => {
    const report = buildWellnessReport({
      ...sample,
      systolic: 181,
      diastolic: 121,
      bloodPressureReadings: [{ systolic: 181, diastolic: 121 }],
      bpReadingCount: 1,
    });
    expect(report.safety.crisisBloodPressure).toBe(true);
    expect(report.safety.urgent).toBe(false);

    const text = buildReportText(report);
    expect(text).toContain("wait at least one minute and repeat it");
    expect(text).toContain(
      "No validated energy or overall health score is calculated.",
    );
    expect(text).not.toMatch(/Energy score: \d+\/100/);
    expect(text).toContain("No routine suggestions are shown");
    expect(text).toContain(DISCLAIMER);

    const document = await buildReportPDF(report);
    const pdfText = extractPdfText(document.output() as string);
    expect(pdfText).toContain("No validated energy or overall health score");
    expect(pdfText).not.toMatch(/Energy score: \d+\/100/);
    expect(pdfText).toContain("No routine suggestions are shown");
    expect(pdfText).toContain(DISCLAIMER);
  });

  it("exports the same visible meanings, careful BP instructions, optional labs and source context", async () => {
    const report = buildWellnessReport({
      ...sample,
      fatigueTwoWeeks: true,
      sleepQuality: 2,
      snores: true,
      wakeUnrefreshed: true,
      waistCm: 88,
      measurementContext: "after coffee",
      glucose: {
        value: 5.6,
        testType: "fasting",
        unit: "mmol/L",
        fastingConfirmed: true,
      },
      hemoglobin: 13.4,
      cholesterol: { value: 190, unit: "mg/dL" },
      conditions: ["diabetes"],
      medication: "yes",
      notes: "fear of eating",
    });
    const text = buildReportText(report);
    expect(text).toContain("One helpful tip: If you repeat it at home");
    expect(text).toContain("Some medicines, including beta-blockers");
    expect(text).toContain("poor-quality sleep");
    expect(text).toContain("Waist-to-height ratio: ~0.512");
    expect(text).toContain("Consider checking in with a doctor.");
    expect(text).toContain("Your doctor’s personal targets may differ.");
    expect(text).toContain(
      "This report does not set diet, weight, or calorie targets.",
    );
    expect(text).toContain(
      "Blood sugar test: Fasting laboratory glucose: 5.6 mmol/L — Shown without interpretation",
    );
    expect(text).toContain(
      "https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis",
    );

    const document = await buildReportPDF(report);
    const pdfText = extractPdfText(document.output() as string);
    expect(pdfText).toContain("Consider checking in with a doctor.");
    expect(pdfText).toContain("Fasting laboratory glucose");
    expect(pdfText).toContain("Shown without interpretation");
    expect(pdfText).toContain("niddk.nih.gov");
    expect(pdfText).toContain(DISCLAIMER);
    expect(document.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("exports the pregnancy-specific message and withholds BMI weight categorization", () => {
    const report = buildWellnessReport({
      ...sample,
      pregnantOrBreastfeeding: "pregnant",
    });
    const text = buildReportText(report);
    expect(text).toContain(
      "BMI & waist: Not assessed — Pregnancy-specific care",
    );
    expect(text).toContain(
      "Pregnancy and breastfeeding can change what measurements mean.",
    );
    expect(text).not.toMatch(/weight loss|lose weight|calorie target/i);
  });
});
