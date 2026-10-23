import type { BloodTypeContext, ValidatedInputs } from "./types";

export const BLOOD_TYPE_SOURCES = [
  {
    name: "NHS: Blood groups and laboratory testing",
    url: "https://www.nhs.uk/tests-and-treatments/blood-groups/",
  },
  {
    name: "NHS: RhD and pregnancy screening",
    url: "https://www.nhs.uk/conditions/rhesus-disease-hdfn/",
  },
  {
    name: "He et al.: ABO blood group and coronary heart disease — cohort study",
    url: "https://pubmed.ncbi.nlm.nih.gov/22895671/",
  },
  {
    name: "Wang et al.: Blood-type diets and cardiometabolic factors",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0084749",
  },
] as const;

/** Educational ABO/RhD context. Never infers disease, changes vital thresholds, or selects transfusions. */
export function bloodTypeContext(
  inputs: Pick<ValidatedInputs, "bloodType" | "pregnantOrBreastfeeding">,
): BloodTypeContext | undefined {
  const value = inputs.bloodType;
  if (!value) return undefined;
  const pregnant = inputs.pregnantOrBreastfeeding === "pregnant";
  const rhNegative = value !== "unknown" && value.endsWith("-");
  return {
    value,
    note:
      value === "unknown"
        ? "Your blood type is not known. That does not prevent a wellness check-in, and the app does not infer it from symptoms, diet or family background."
        : "This is your self-reported ABO/RhD blood group, not a health condition. Population studies report some blood-group associations, but this app has no validated method to predict your individual diseases, fitness, diet needs or overall health from blood type.",
    maternityNote: pregnant
      ? rhNegative
        ? "You reported an RhD-negative group during pregnancy. Ask your maternity team about laboratory blood grouping, antibody screening and whether anti-D prevention is appropriate. Your baby’s RhD type and your antibody results matter; your blood type alone does not establish incompatibility or a problem with the pregnancy."
        : "During pregnancy, follow your maternity team’s blood-group and antibody-screening plan even if you report an RhD-positive group or do not know your type. This form cannot establish your baby’s type or rule out blood-group antibody problems."
      : undefined,
    tip: "Use a laboratory-confirmed result when blood group is clinically needed. This self-reported entry must never be used to choose blood for a transfusion. No blood-type diet or disease prediction is generated.",
  };
}
