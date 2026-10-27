export type SexAtBirth = "female" | "male" | "prefer-not-to-say";
export type Region = "unspecified" | "south-asian" | "east-asian" | "other";
export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];
export type BPReading = { systolic: string; diastolic: string };
export type GlucoseTestType = "fasting" | "hba1c" | "other";
export type GlucoseUnit = "mg/dL" | "mmol/L" | "%";
export type SymptomKey =
  | "tiredOnWaking"
  | "afternoonCrash"
  | "dizziness"
  | "shortnessOfBreath"
  | "palpitations"
  | "chestDiscomfort"
  | "backPain"
  | "numbness"
  | "weakness"
  | "speechChanges"
  | "confusion"
  | "swelling"
  | "frequentThirstUrination"
  | "unexplainedWeightChange"
  | "feelingCold"
  | "brainFog"
  | "lowMood"
  | "fainting"
  | "headache"
  | "visionChanges";
export type ConditionKey =
  | "diabetes"
  | "thyroid"
  | "heartDisease"
  | "kidneyDisease"
  | "anemia"
  | "asthma"
  | "depressionAnxiety"
  | "sleepApnea"
  | "other";

export interface FormData {
  bloodType: BloodType | "unknown" | "";
  age: string;
  sexAtBirth: SexAtBirth | "";
  height: string;
  heightInches: string;
  heightUnit: "cm" | "ftin";
  weight: string;
  weightUnit: "kg" | "lb";
  readings: BPReading[];
  restingHeartRate: string;
  sleepHours: string;
  sleepQuality: string;
  wakeUps: boolean;
  snores: boolean;
  wakeUnrefreshed: boolean;
  fatigueTwoWeeks: boolean;
  activityMinutes: string;
  sittingHours: string;
  waterGlasses: string;
  caffeineCups: string;
  stress: string;
  mood: string;
  region: Region;
  waistCm: string;
  muscularBuild: boolean;
  smoking: "no" | "some-days" | "daily" | "";
  alcohol: "none" | "occasional" | "regular" | "";
  pregnantOrBreastfeeding: "no" | "pregnant" | "breastfeeding" | "";
  conditions: ConditionKey[];
  medication: "no" | "yes" | "";
  symptoms: SymptomKey[];
  notes: string;
  shiftWorkerOrNewParent: boolean;
  measurementContext: string;
  glucoseValue: string;
  glucoseTestType: GlucoseTestType | "";
  glucoseUnit: GlucoseUnit;
  glucoseFastingConfirmed: boolean;
  hemoglobin: string;
  cholesterol: string;
  cholesterolUnit: "mg/dL" | "mmol/L";
}

export interface GlucoseMeasurement {
  value: number;
  testType: GlucoseTestType;
  unit: GlucoseUnit;
  fastingConfirmed: boolean;
}

export interface ValidatedInputs {
  bloodType?: BloodType | "unknown";
  age: number;
  sexAtBirth: SexAtBirth;
  heightCm: number;
  weightKg: number;
  systolic?: number;
  diastolic?: number;
  bloodPressureReadings: Array<{ systolic: number; diastolic: number }>;
  bpReadingCount: number;
  restingHeartRate?: number;
  sleepHours: number;
  sleepQuality?: number;
  wakeUps: boolean;
  snores: boolean;
  wakeUnrefreshed: boolean;
  fatigueTwoWeeks: boolean;
  activityMinutes?: number;
  sittingHours?: number;
  waterGlasses?: number;
  caffeineCups?: number;
  stress?: number;
  mood?: number;
  region: Region;
  waistCm?: number;
  muscularBuild: boolean;
  smoking?: "no" | "some-days" | "daily";
  alcohol?: "none" | "occasional" | "regular";
  pregnantOrBreastfeeding?: "no" | "pregnant" | "breastfeeding";
  conditions: ConditionKey[];
  medication?: "no" | "yes";
  symptoms: SymptomKey[];
  notes: string;
  shiftWorkerOrNewParent: boolean;
  measurementContext: string;
  glucose?: GlucoseMeasurement;
  hemoglobin?: number;
  cholesterol?: { value: number; unit: "mg/dL" | "mmol/L" };
}

export type BPCategory =
  | "Low reading"
  | "Normal"
  | "Elevated"
  | "Stage 1"
  | "Stage 2";
export type BMICategory =
  | "Underweight"
  | "Normal"
  | "Overweight"
  | "Obese"
  | "Increased risk"
  | "High risk"
  | "Not assessed";
export type SleepCategory =
  | "Short"
  | "Borderline"
  | "Recommended range"
  | "Long";
export type HRCategory =
  | "Low reading"
  | "Below 60, often normal"
  | "Usual range"
  | "High reading";
export type GlucoseCategory =
  | "Low glucose reading"
  | "Very high glucose reading"
  | "Below common screening cutoff"
  | "Common increased-risk screening range"
  | "At or above a common screening threshold"
  | "Shown without interpretation";
export type Status =
  | "No automatic flags"
  | "Some things to watch"
  | "Talk to a doctor soon"
  | "Urgent";

export interface MetricClassification<T extends string> {
  value: number;
  category: T;
  note: string;
  tip: string;
}

export interface SafetyFlags {
  urgent: boolean;
  urgentReasons: string[];
  crisisBloodPressure: boolean;
  pregnancyConcern: boolean;
  crisisOrRedFlag: boolean;
  selfHarmConcern: boolean;
  disorderedEatingConcern: boolean;
  medicalReview: boolean;
  abnormalVitals: boolean;
  glucoseConcern: boolean;
}

export interface CheckInContext {
  missingInputs: string[];
  bloodPressureMissing: boolean;
  bloodPressureNote?: string;
}

export interface BloodTypeContext {
  value: BloodType | "unknown";
  note: string;
  maternityNote?: string;
  tip: string;
}

export interface MissingBloodPressure {
  value: undefined;
  category: "Not assessed";
  note: string;
  tip: string;
}

export interface WellnessReport {
  inputs: ValidatedInputs;
  bp: MetricClassification<BPCategory> | MissingBloodPressure;
  bloodType?: BloodTypeContext;
  bmi: MetricClassification<BMICategory>;
  waistToHeightRatio?: number;
  sleep: MetricClassification<SleepCategory>;
  heartRate?: MetricClassification<HRCategory>;
  glucose?: MetricClassification<GlucoseCategory>;
  context: CheckInContext;
  safety: SafetyFlags;
  status: Status;
  summary: string;
  actions: string[];
  fatigueReasons: string[];
  doctorQuestions: string[];
}
