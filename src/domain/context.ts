import type { CheckInContext, ValidatedInputs } from "./types";

/** Missing fields describe data availability, never medical confidence or energy. */
export function checkInContext(inputs: ValidatedInputs): CheckInContext {
  const bloodPressureMissing =
    inputs.systolic === undefined || inputs.diastolic === undefined;
  return {
    bloodPressureMissing,
    bloodPressureNote: bloodPressureMissing
      ? "Confidence: lower for blood-pressure assessment because no BP reading was entered. This report still uses the other details you shared, but cannot assess high or low blood pressure. A properly measured reading would add BP screening context and BP-specific safety checks. This describes missing information, not a validated diagnostic confidence score; no BP has been estimated from your other details."
      : undefined,
    missingInputs: [
      ...(bloodPressureMissing ? ["Blood pressure"] : []),
      ...(inputs.restingHeartRate === undefined ? ["Resting heart rate"] : []),
      ...(inputs.sleepQuality === undefined ? ["Sleep quality"] : []),
      ...(inputs.activityMinutes === undefined ? ["Physical activity"] : []),
      ...(inputs.sittingHours === undefined ? ["Sitting time"] : []),
      ...(inputs.waterGlasses === undefined ? ["Water intake"] : []),
      ...(inputs.caffeineCups === undefined ? ["Caffeine"] : []),
      ...(inputs.stress === undefined ? ["Stress"] : []),
      ...(inputs.mood === undefined ? ["Mood"] : []),
      ...(inputs.waistCm === undefined ? ["Waist measurement"] : []),
    ],
  };
}
