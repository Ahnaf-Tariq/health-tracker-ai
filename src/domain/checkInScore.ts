import type { WellnessReport } from "./types";

export interface CheckInScoreItem {
  label: string;
  points: number;
}

export interface CheckInScore {
  value: number;
  assessedChecks: number;
  breakdown: CheckInScoreItem[];
}

function bmiPoints(report: WellnessReport): number | undefined {
  const { category, value } = report.bmi;
  switch (category) {
    case "Normal":
      return 100;
    case "Underweight":
      // WHO thinness grades: mild 17–18.49, moderate 16–16.99, severe < 16.
      if (value < 15) return 30;
      if (value < 16) return 45;
      if (value < 17) return 60;
      if (value < 18) return 75;
      return 88;
    case "Overweight":
      return 85;
    case "Increased risk":
      return 88;
    case "Obese":
      return value >= 35 ? 55 : 70;
    case "High risk":
      return 65;
    default:
      return undefined;
  }
}

function bpPoints(report: WellnessReport): number | undefined {
  if (report.bp.category === "Not assessed") return undefined;
  if (report.safety.crisisBloodPressure) return 25;
  const { inputs } = report;
  const systolic = inputs.systolic ?? 0;
  const diastolic = inputs.diastolic ?? 0;
  switch (report.bp.category) {
    case "Normal":
      return 100;
    case "Elevated":
      return 88;
    case "Stage 1":
      return 75;
    case "Stage 2":
      return systolic >= 160 || diastolic >= 100 ? 42 : 58;
    case "Low reading":
      return 75;
    default:
      return undefined;
  }
}

function sleepPoints(report: WellnessReport): number {
  const hours = report.sleep.value;
  if (hours >= 7 && hours <= 9) return 100;
  if (hours > 9) return hours <= 10 ? 90 : 75;
  if (hours >= 6) return 85;
  if (hours >= 5) return 68;
  if (hours >= 4) return 50;
  return 35;
}

function heartRatePoints(report: WellnessReport): number | undefined {
  if (!report.heartRate) return undefined;
  const bpm = report.heartRate.value;
  if (bpm >= 60 && bpm <= 100) return 100;
  if (bpm >= 50 && bpm < 60) return 95;
  if (bpm >= 40 && bpm < 50) return 80;
  if (bpm < 40) return 60;
  if (bpm <= 110) return 85;
  if (bpm <= 120) return 75;
  return 60;
}

function glucosePoints(report: WellnessReport): number | undefined {
  if (!report.glucose) return undefined;
  const table: Record<string, number> = {
    "Low glucose reading": 30,
    "Very high glucose reading": 30,
    "Below common screening cutoff": 100,
    "Common increased-risk screening range": 75,
    "At or above a common screening threshold": 55,
  };
  // Display-only glucose entries cannot be fairly compared to a shared range.
  return table[report.glucose.category];
}

export function calculateCheckInScore(report: WellnessReport): CheckInScore {
  const breakdown: CheckInScoreItem[] = [];
  const add = (label: string, points: number | undefined) => {
    if (points !== undefined) breakdown.push({ label, points });
  };

  add("BMI", bmiPoints(report));
  add("Blood pressure", bpPoints(report));
  add("Sleep", sleepPoints(report));
  add("Resting heart rate", heartRatePoints(report));
  add("Blood sugar", glucosePoints(report));

  if (breakdown.length === 0) return { value: 0, assessedChecks: 0, breakdown };

  const mean =
    breakdown.reduce((sum, item) => sum + item.points, 0) / breakdown.length;
  // A very high BP or a low/very high glucose reading should not be averaged away.
  const capped =
    report.safety.crisisBloodPressure || report.safety.glucoseConcern
      ? Math.min(mean, 60)
      : mean;

  return {
    value: Math.round(capped),
    assessedChecks: breakdown.length,
    breakdown,
  };
}
