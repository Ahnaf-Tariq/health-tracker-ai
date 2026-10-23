import type {
  FormData,
  GlucoseTestType,
  GlucoseUnit,
  SexAtBirth,
  ValidatedInputs,
} from "./types";
import { safeUserText } from "./privacy";
import { BLOOD_TYPES } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  inputs?: ValidatedInputs;
  isMinor: boolean;
}

function readNumber(
  raw: string,
  field: string,
  min: number,
  max: number,
  errors: Record<string, string>,
  options: { optional?: boolean; integer?: boolean } = {},
): number | undefined {
  const text = raw.trim();
  if (!text) {
    if (!options.optional) errors[field] = "This field is required.";
    return undefined;
  }
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(text)) {
    errors[field] =
      "Please enter a number using a decimal point if needed (for example, 70.5).";
    return undefined;
  }
  const value = Number(text);
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (options.integer && !Number.isInteger(value))
  ) {
    errors[field] =
      options.integer && field === "age"
        ? "Enter your age in whole years (18 or older)."
        : `Please re-check this number. Enter a value from ${min} to ${max}${options.integer ? " (whole numbers)" : ""}.`;
    return undefined;
  }
  return value;
}

const optionalInteger = (
  raw: string,
  field: string,
  min: number,
  max: number,
  errors: Record<string, string>,
) =>
  readNumber(raw, field, min, max, errors, { optional: true, integer: true });

function readGlucose(
  form: FormData,
  errors: Record<string, string>,
): ValidatedInputs["glucose"] {
  let min = 0.1;
  let max = 2000;
  if (form.glucoseTestType === "fasting") {
    min = form.glucoseUnit === "mmol/L" ? 0.6 : 10;
    max = form.glucoseUnit === "mmol/L" ? 55.5 : 1000;
  } else if (form.glucoseTestType === "hba1c") {
    min = 3;
    max = 20;
  }
  const value = readNumber(
    form.glucoseValue,
    "glucoseValue",
    min,
    max,
    errors,
    { optional: true },
  );
  if (value === undefined) return undefined;
  if (!form.glucoseTestType) {
    errors.glucoseTestType =
      "Choose the kind of result so it is not interpreted using the wrong range.";
    return undefined;
  }
  if (form.glucoseTestType === "hba1c" && form.glucoseUnit !== "%") {
    errors.glucoseUnit = "HbA1c values use percent (%).";
    return undefined;
  }
  if (form.glucoseTestType !== "hba1c" && form.glucoseUnit === "%") {
    errors.glucoseUnit = "Choose mg/dL or mmol/L for a blood glucose value.";
    return undefined;
  }
  const testType: GlucoseTestType = form.glucoseTestType;
  const unit: GlucoseUnit = form.glucoseUnit;
  return {
    value,
    testType,
    unit,
    fastingConfirmed: form.glucoseFastingConfirmed,
  };
}

export function validateForm(form: FormData): ValidationResult {
  const errors: Record<string, string> = {};
  if (
    form.bloodType &&
    form.bloodType !== "unknown" &&
    !BLOOD_TYPES.includes(form.bloodType)
  ) {
    errors.bloodType =
      "Choose a listed blood type, select ‘I don’t know’, or skip this field.";
  }
  const notes = safeUserText(form.notes, 300);
  const measurementContext = safeUserText(form.measurementContext, 120);
  const age = readNumber(form.age, "age", 0, 120, errors, { integer: true });
  if (age !== undefined && age < 18) {
    errors.age =
      "Health Tracker is for adults. Please speak with a pediatrician for help with a child’s health.";
    return { ok: false, errors, isMinor: true };
  }
  if (!form.sexAtBirth)
    errors.sexAtBirth = "Choose an option or “Prefer not to say”.";

  let heightCm: number | undefined;
  if (form.heightUnit === "cm") {
    heightCm = readNumber(form.height, "height", 100, 230, errors);
  } else {
    const feet = readNumber(form.height, "height", 3, 7, errors, {
      integer: true,
    });
    const inches = readNumber(
      form.heightInches || "0",
      "heightInches",
      0,
      11.999,
      errors,
    );
    if (feet !== undefined && inches !== undefined) {
      heightCm = Math.round((feet * 12 + inches) * 2.54 * 10) / 10;
      if (heightCm < 100 || heightCm > 230)
        errors.height =
          "Please re-check this number; height should convert to 100–230 cm.";
    }
  }

  let weightKg: number | undefined;
  const enteredWeight = readNumber(
    form.weight,
    "weight",
    form.weightUnit === "kg" ? 25 : 25 * 2.2046226218,
    form.weightUnit === "kg" ? 300 : 300 * 2.2046226218,
    errors,
  );
  if (enteredWeight !== undefined)
    weightKg =
      form.weightUnit === "kg" ? enteredWeight : enteredWeight / 2.2046226218;

  const readings: Array<{ systolic: number; diastolic: number }> = [];
  form.readings.forEach((reading, index) => {
    const top = reading.systolic.trim();
    const bottom = reading.diastolic.trim();
    if (!top && !bottom) return;
    const systolic = readNumber(
      top,
      `reading${index + 1}Systolic`,
      1,
      350,
      errors,
    );
    const diastolic = readNumber(
      bottom,
      `reading${index + 1}Diastolic`,
      1,
      250,
      errors,
    );
    if (systolic !== undefined && diastolic !== undefined) {
      if (systolic <= diastolic)
        errors[`reading${index + 1}Systolic`] =
          "The top number is usually higher than the bottom number. Please re-check both numbers.";
      readings.push({ systolic, diastolic });
    }
  });
  const systolic = readings.length
    ? readings.reduce((sum, reading) => sum + reading.systolic, 0) /
      readings.length
    : undefined;
  const diastolic = readings.length
    ? readings.reduce((sum, reading) => sum + reading.diastolic, 0) /
      readings.length
    : undefined;

  const restingHeartRate = optionalInteger(
    form.restingHeartRate,
    "restingHeartRate",
    30,
    220,
    errors,
  );
  const sleepHours = readNumber(form.sleepHours, "sleepHours", 0, 24, errors);
  const sleepQuality = optionalInteger(
    form.sleepQuality,
    "sleepQuality",
    1,
    5,
    errors,
  );
  const activityMinutes = optionalInteger(
    form.activityMinutes,
    "activityMinutes",
    0,
    2000,
    errors,
  );
  const sittingHours = readNumber(
    form.sittingHours,
    "sittingHours",
    0,
    24,
    errors,
    { optional: true },
  );
  const waterGlasses = optionalInteger(
    form.waterGlasses,
    "waterGlasses",
    0,
    50,
    errors,
  );
  const caffeineCups = readNumber(
    form.caffeineCups,
    "caffeineCups",
    0,
    30,
    errors,
    { optional: true },
  );
  const stress = optionalInteger(form.stress, "stress", 1, 5, errors);
  const mood = optionalInteger(form.mood, "mood", 1, 5, errors);
  const waistCm = readNumber(form.waistCm, "waistCm", 40, 250, errors, {
    optional: true,
  });
  if (form.notes.length > 300)
    errors.notes = "Please keep your note to 300 characters or fewer.";
  const glucose = readGlucose(form, errors);
  const hemoglobin = readNumber(form.hemoglobin, "hemoglobin", 1, 30, errors, {
    optional: true,
  });
  const cholesterolValue = readNumber(
    form.cholesterol,
    "cholesterol",
    1,
    1500,
    errors,
    { optional: true },
  );

  const requiredValuesPresent =
    age !== undefined &&
    age >= 18 &&
    !!form.sexAtBirth &&
    heightCm !== undefined &&
    weightKg !== undefined &&
    sleepHours !== undefined;
  if (!requiredValuesPresent || Object.keys(errors).length > 0)
    return { ok: false, errors, isMinor: false };

  const sexAtBirth = form.sexAtBirth as SexAtBirth;
  const cholesterol =
    cholesterolValue === undefined
      ? undefined
      : { value: cholesterolValue, unit: form.cholesterolUnit };
  return {
    ok: true,
    errors,
    isMinor: false,
    inputs: {
      bloodType: form.bloodType || undefined,
      age: age as number,
      sexAtBirth,
      heightCm: heightCm as number,
      weightKg: weightKg as number,
      systolic,
      diastolic,
      bloodPressureReadings: readings,
      bpReadingCount: readings.length,
      restingHeartRate,
      sleepHours: sleepHours as number,
      sleepQuality,
      wakeUps: form.wakeUps,
      snores: form.snores,
      wakeUnrefreshed: form.wakeUnrefreshed,
      fatigueTwoWeeks: form.fatigueTwoWeeks,
      activityMinutes,
      sittingHours,
      waterGlasses,
      caffeineCups,
      stress,
      mood,
      region: form.region,
      waistCm,
      muscularBuild: form.muscularBuild,
      smoking: form.smoking || undefined,
      alcohol: form.alcohol || undefined,
      pregnantOrBreastfeeding: form.pregnantOrBreastfeeding || undefined,
      conditions: [...form.conditions],
      medication: form.medication || undefined,
      symptoms: [...form.symptoms],
      notes,
      shiftWorkerOrNewParent: form.shiftWorkerOrNewParent,
      measurementContext,
      glucose,
      hemoglobin,
      cholesterol,
    },
  };
}

export function emptyForm(): FormData {
  return {
    bloodType: "",
    age: "",
    sexAtBirth: "",
    height: "",
    heightInches: "",
    heightUnit: "cm",
    weight: "",
    weightUnit: "kg",
    readings: [{ systolic: "", diastolic: "" }],
    restingHeartRate: "",
    sleepHours: "",
    sleepQuality: "",
    wakeUps: false,
    snores: false,
    wakeUnrefreshed: false,
    fatigueTwoWeeks: false,
    activityMinutes: "",
    sittingHours: "",
    waterGlasses: "",
    caffeineCups: "",
    stress: "",
    mood: "",
    region: "unspecified",
    waistCm: "",
    muscularBuild: false,
    smoking: "",
    alcohol: "",
    pregnantOrBreastfeeding: "",
    conditions: [],
    medication: "",
    symptoms: [],
    notes: "",
    shiftWorkerOrNewParent: false,
    measurementContext: "",
    glucoseValue: "",
    glucoseTestType: "",
    glucoseUnit: "mg/dL",
    glucoseFastingConfirmed: false,
    hemoglobin: "",
    cholesterol: "",
    cholesterolUnit: "mg/dL",
  };
}
