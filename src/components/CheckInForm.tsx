import { useRef, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  CircleHelp,
  HeartPulse,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { CheckInProgress } from "./CheckInProgress";
import { CheckInSidebar } from "./CheckInSidebar";
import { emptyForm, validateForm } from "../domain/validation";
import { BLOOD_TYPES } from "../domain/types";
import { hasSelfHarmConcern, safeUserText } from "../domain/privacy";
import { buildWellnessReport, previewSafety } from "../domain/rules";
import type {
  ConditionKey,
  FormData,
  SymptomKey,
  WellnessReport,
} from "../domain/types";
import { FormField, TextInput } from "./FormField";
import { SelectField, type SelectOption } from "./SelectField";

const round1 = (value: number) => Math.round(value * 10) / 10;
const numeric = (value: string) =>
  /^(?:\d+\.?\d*|\.\d+)$/.test(value.trim()) ? Number(value.trim()) : undefined;

const symptomOptions: Array<[SymptomKey, string]> = [
  ["tiredOnWaking", "Tired on waking"],
  ["afternoonCrash", "Afternoon energy crash"],
  ["dizziness", "Dizziness"],
  ["shortnessOfBreath", "Sudden or severe shortness of breath"],
  ["palpitations", "Palpitations"],
  ["chestDiscomfort", "New or persistent chest discomfort or pain"],
  ["backPain", "Back pain"],
  ["numbness", "Sudden numbness, especially on one side"],
  ["weakness", "Sudden weakness, especially on one side"],
  ["speechChanges", "Sudden difficulty speaking"],
  ["confusion", "New or sudden confusion"],
  ["fainting", "Fainting now or not fully recovered"],
  ["swelling", "New marked swelling of the face or hands"],
  ["frequentThirstUrination", "Frequent thirst or urination"],
  ["unexplainedWeightChange", "Unexplained weight change"],
  ["feelingCold", "Feeling unusually cold"],
  ["brainFog", "Brain fog"],
  ["lowMood", "Low mood"],
  ["headache", "Sudden or persistent severe headache"],
  ["visionChanges", "New or sudden vision changes"],
];
const conditionOptions: Array<[ConditionKey, string]> = [
  ["diabetes", "Diabetes"],
  ["thyroid", "Thyroid condition"],
  ["heartDisease", "Heart condition"],
  ["kidneyDisease", "Kidney condition"],
  ["anemia", "Anemia"],
  ["asthma", "Asthma"],
  ["depressionAnxiety", "Depression or anxiety"],
  ["sleepApnea", "Sleep apnea"],
  ["other", "Another condition"],
];

interface Props {
  onReport: (report: WellnessReport) => void;
  onSupport: () => void;
  onPrivacy?: () => void;
}

export function CheckInForm({ onReport, onSupport, onPrivacy }: Props) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMinor, setIsMinor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const safetyPreview = previewSafety(form);
  const updateForm = (next: FormData) => {
    setForm(next);
    setErrors((current) =>
      Object.keys(current).length > 0 ? validateForm(next).errors : current,
    );
  };
  const update = (key: keyof FormData, value: unknown) => {
    updateForm({ ...form, [key]: value } as FormData);
    if (key === "age" && Number(value) >= 18) setIsMinor(false);
  };
  const updateRow = (
    index: number,
    key: "systolic" | "diastolic",
    value: string,
  ) => {
    const readings = [...form.readings];
    readings[index] = {
      ...(readings[index] ?? { systolic: "", diastolic: "" }),
      [key]: value,
    };
    update("readings", readings);
  };

  function changeWeightUnit(next: "kg" | "lb") {
    if (next === form.weightUnit) return;
    const amount = numeric(form.weight);
    const converted =
      amount === undefined
        ? ""
        : String(
            round1(
              next === "lb" ? amount * 2.2046226218 : amount / 2.2046226218,
            ),
          );
    updateForm({ ...form, weightUnit: next, weight: converted });
  }
  function changeHeightUnit(next: "cm" | "ftin") {
    if (next === form.heightUnit) return;
    if (next === "ftin") {
      const cm = numeric(form.height);
      if (cm === undefined) {
        updateForm({
          ...form,
          heightUnit: next,
          height: "",
          heightInches: "",
        });
        return;
      }
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inch = round1(totalInches - feet * 12);
      updateForm({
        ...form,
        heightUnit: next,
        height: String(feet),
        heightInches: String(inch >= 12 ? 0 : inch),
      });
      return;
    }
    const feet = numeric(form.height);
    const inches = numeric(form.heightInches);
    const cm =
      feet === undefined
        ? undefined
        : round1((feet * 12 + (inches ?? 0)) * 2.54);
    updateForm({
      ...form,
      heightUnit: next,
      height: cm === undefined ? "" : String(cm),
      heightInches: "",
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const sanitizedSafetyNotes = safeUserText(
      form.notes,
      Math.max(300, form.notes.length),
    );
    if (
      hasSelfHarmConcern(sanitizedSafetyNotes) ||
      hasSelfHarmConcern(form.notes)
    ) {
      onSupport();
      return;
    }
    busy.current = true;
    const result = validateForm(form);
    setErrors(result.errors);
    if (result.isMinor) {
      setIsMinor(true);
      busy.current = false;
      document.getElementById("age")?.focus();
      return;
    }
    setIsMinor(false);
    if (!result.ok || !result.inputs) {
      busy.current = false;
      if (
        safetyPreview.urgent ||
        safetyPreview.crisisBloodPressure ||
        safetyPreview.glucoseConcern
      ) {
        const notice = document.getElementById("form-safety-notice");
        notice?.focus({ preventScroll: true });
        notice?.scrollIntoView({ block: "start", behavior: "auto" });
        return;
      }
      const first = Object.keys(result.errors)[0];
      const field = first ? document.getElementById(first) : null;
      field?.focus();
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      onReport(buildWellnessReport(result.inputs!));
      setSubmitting(false);
      busy.current = false;
    }, 380);
  }

  function numericControl(
    key: keyof FormData,
    label: string,
    opts: {
      suffix?: string;
      hint?: string;
      optional?: boolean;
      placeholder?: string;
      min?: string;
      id?: string;
    } = {},
  ) {
    const id = opts.id ?? String(key);
    const value = form[key] as string;
    const hintId = opts.hint ? `${id}-hint` : undefined;
    return (
      <FormField
        id={id}
        label={label}
        optional={opts.optional}
        required={!opts.optional}
        hint={opts.hint}
        error={errors[id]}
      >
        <TextInput
          id={id}
          value={value}
          onChange={(next) => update(key, next)}
          placeholder={opts.placeholder ?? "—"}
          suffix={opts.suffix}
          hintId={hintId}
          error={errors[id]}
        />
      </FormField>
    );
  }
  function selectControl(
    key: keyof FormData,
    label: string,
    options: SelectOption[],
    opts: {
      optional?: boolean;
      required?: boolean;
      hint?: string;
      placeholder?: string;
      onChange?: (value: string) => void;
    } = {},
  ) {
    const id = String(key);
    const describedBy =
      [
        opts.hint ? `${id}-hint` : undefined,
        errors[id] ? `${id}-error` : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <FormField
        id={id}
        label={label}
        optional={opts.optional}
        required={opts.required}
        hint={opts.hint}
        error={errors[id]}
      >
        <SelectField
          id={id}
          value={String(form[key] ?? "")}
          options={options}
          onChange={opts.onChange ?? ((value) => update(key, value))}
          placeholder={opts.placeholder ?? "Choose an option"}
          labelId={`${id}-label`}
          describedBy={describedBy}
          error={!!errors[id]}
        />
      </FormField>
    );
  }
  function checkBox<T extends string>(
    items: Array<[T, string]>,
    chosen: T[],
    key: "symptoms" | "conditions",
  ) {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map(([value, label]) => (
          <label
            className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]"
            key={value}
          >
            <input
              className="peer sr-only! appearance-none"
              type="checkbox"
              checked={chosen.includes(value)}
              onChange={(event) => {
                const next = event.currentTarget.checked
                  ? [...chosen, value]
                  : chosen.filter((item) => item !== value);
                update(key, next);
              }}
            />
            <span
              className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
              data-ui="custom-check"
              aria-hidden="true"
            >
              <Check
                className="size-3 opacity-0 transition-opacity"
                aria-hidden="true"
              />
            </span>
            <span>{label}</span>
          </label>
        ))}
      </div>
    );
  }

  const weightPreview = numeric(form.weight);
  const heightCmPreview =
    form.heightUnit === "cm"
      ? numeric(form.height)
      : (() => {
          const ft = numeric(form.height);
          const inches = numeric(form.heightInches);
          return ft === undefined
            ? undefined
            : (ft * 12 + (inches ?? 0)) * 2.54;
        })();
  const heightConversion =
    heightCmPreview === undefined
      ? ""
      : form.heightUnit === "cm"
        ? `About ${Math.floor(heightCmPreview / 2.54 / 12)} ft ${round1((heightCmPreview / 2.54) % 12)} in`
        : `About ${round1(heightCmPreview)} cm`;
  const weightConversion =
    weightPreview === undefined
      ? ""
      : form.weightUnit === "kg"
        ? `About ${round1(weightPreview * 2.2046226218)} lb`
        : `About ${round1(weightPreview / 2.2046226218)} kg`;

  return (
    <main className="pb-8">
      {safetyPreview.urgent ||
      safetyPreview.crisisBloodPressure ||
      safetyPreview.glucoseConcern ? (
        <section
          id="form-safety-notice"
          tabIndex={-1}
          role="alert"
          aria-label="Important safety guidance"
          className="mx-auto my-6 max-w-[1144px] rounded-xl border border-amber/40 bg-amber-bg p-6 text-[13px] leading-relaxed text-ink max-xl:mx-6"
        >
          <h2 className="mb-3 font-display text-[27px]">
            Please read before continuing
          </h2>
          {safetyPreview.urgent ? (
            <>
              <p className="font-semibold">
                Get urgent medical help now. Do not wait to finish this form.
              </p>
              <ul className="space-y-2 pl-5">
                {safetyPreview.urgentReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          ) : null}
          {safetyPreview.crisisBloodPressure && !safetyPreview.urgent ? (
            <p>
              A reading above 180 systolic or 120 diastolic needs attention.
              Without concerning symptoms, wait at least one minute and repeat
              it; if still this high, contact a healthcare professional as soon
              as possible. With chest pain, breathlessness, weakness, confusion
              or vision/speech changes, call emergency services now.
            </p>
          ) : null}
          {safetyPreview.glucoseConcern ? (
            <p>
              An entered glucose result is low or very high. If this describes a
              current reading, follow your care plan and get prompt medical
              help. A current reading that stays at 300 mg/dL (about 16.7
              mmol/L) or above, or confusion, fainting or difficulty breathing
              needs emergency help. If glucose is below 70 mg/dL (3.9 mmol/L)
              and you can swallow safely, take 15–20 g of glucose and recheck
              after 15 minutes. Do not give food or drink to someone who cannot
              swallow safely; call emergency services. Historical results still
              need clinical follow-up.
            </p>
          ) : null}
        </section>
      ) : null}
      <section
        className="relative overflow-hidden bg-paper"
        aria-labelledby="form-heading"
      >
        <div className="relative mx-auto min-h-[320px] max-w-[1240px] px-6 pt-12 pb-16 sm:px-10 lg:px-12 lg:pt-14">
          <img
            src="/images/check-in-scene.webp"
            alt=""
            width={1774}
            height={887}
            className="absolute inset-y-0 right-0 h-full w-[65%] object-cover object-right opacity-50 lg:opacity-100"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-linear-to-r from-paper via-paper/90 to-paper/20 lg:via-paper/60 lg:to-transparent" />
          <div className="relative z-10 max-w-[620px]">
            <span className="mb-5 inline-flex rounded-full bg-teal-tint px-3 py-1.5 text-[9px] font-semibold tracking-[0.1em] text-teal">
              HEALTH CHECK-IN
            </span>
            <h1
              id="form-heading"
              className="mb-5 font-display text-[clamp(44px,5vw,67px)] font-normal leading-[1.05] tracking-[-0.045em] text-ink"
            >
              A clearer view of
              <br />
              <em className="font-normal text-teal">your health.</em>
            </h1>
            <p className="mb-0 max-w-[420px] text-[13px] leading-[1.8] text-muted">
              Share the readings you know. Get thoughtful context for your
              wellbeing, in a check-in that’s entirely yours.
            </p>
          </div>
          <p className="absolute right-12 bottom-12 hidden text-[12px] leading-[1.7] text-[#173b37] xl:block">
            Better understanding.
            <br />
            Better next steps.
            <br />A healthier you.
          </p>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-6 grid w-[calc(100%_-_48px)] max-w-[1144px] items-start gap-8 sm:w-[calc(100%_-_80px)] lg:w-[calc(100%_-_96px)] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <form
            className="min-w-0 rounded-2xl border border-line bg-panel p-5 shadow-panel sm:p-8 lg:p-10"
            onSubmit={submit}
            noValidate
          >
            <CheckInProgress />
            <section
              className="mb-8 space-y-6"
              aria-labelledby="essentials-heading"
            >
              <div className="mb-7">
                <h2
                  id="essentials-heading"
                  className="mb-2 font-display text-[28px] font-normal tracking-[-0.035em]"
                >
                  Your Details
                </h2>
                <p className="mb-0 text-[12px] leading-relaxed text-muted">
                  Let’s start with some basic information about you. Fields
                  marked <span className="text-red">*</span> are required.
                </p>
              </div>
              <div
                className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
                data-ui="form-grid"
              >
                <div className="sm:col-span-2">
                  {selectControl(
                    "bloodType",
                    "Blood type",
                    [
                      { value: "", label: "Skip this detail" },
                      { value: "unknown", label: "I don’t know my blood type" },
                      ...BLOOD_TYPES.map((value) => ({
                        value,
                        label: value.replace("-", "−"),
                      })),
                    ],
                    {
                      optional: true,
                      hint: "Only enter a type you know from a blood test. Used for limited ABO/RhD context, not disease prediction.",
                    },
                  )}
                </div>
                <div className="min-w-0">
                  {numericControl("age", "Age", {
                    suffix: "years",
                    placeholder: "For example, 35",
                  })}
                  {isMinor ? (
                    <p
                      className="flex items-start bg-amber-bg rounded-[12px] text-amber text-[12px] leading-[1.5] mt-2.5 mb-0 mx-0 px-[15px] py-3.5 gap-2.5 [&_svg]:flex-none"
                      role="alert"
                    >
                      <CircleHelp size={16} />
                      Health Tracker is for adults aged 18 and over. For a
                      child, please speak with a pediatrician. No results were
                      calculated.
                    </p>
                  ) : null}
                </div>
                {selectControl(
                  "sexAtBirth",
                  "Sex at birth",
                  [
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "prefer-not-to-say", label: "Prefer not to say" },
                  ],
                  { required: true },
                )}
                <div className="min-w-0 space-y-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium leading-relaxed text-ink">
                      Height <span className="text-[#ba7044]">*</span>
                    </span>
                    <div
                      className="inline-flex gap-0.5 rounded-lg border border-line bg-paper p-0.5 [&_button]:min-h-8 [&_button]:min-w-10 [&_button]:cursor-pointer [&_button]:rounded-md [&_button]:px-2.5 [&_button]:text-[11px] [&_button]:font-medium [&_button]:text-muted [&_button]:transition-colors [&_button[aria-pressed=true]]:bg-teal [&_button[aria-pressed=true]]:text-white [&_button[aria-pressed=true]]:shadow-sm"
                      role="group"
                      aria-label="Height unit"
                    >
                      <button
                        type="button"
                        aria-pressed={form.heightUnit === "cm"}
                        onClick={() => changeHeightUnit("cm")}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        aria-pressed={form.heightUnit === "ftin"}
                        onClick={() => changeHeightUnit("ftin")}
                      >
                        ft / in
                      </button>
                    </div>
                  </div>
                  {form.heightUnit === "cm" ? (
                    <FormField
                      id="height"
                      label="Height in centimeters"
                      required
                      hint="Usual range: 100–230 cm."
                      error={errors.height}
                    >
                      <TextInput
                        id="height"
                        value={form.height}
                        onChange={(value) => update("height", value)}
                        suffix="cm"
                        hintId="height-hint"
                        error={errors.height}
                      />
                    </FormField>
                  ) : (
                    <div
                      className="mt-3 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
                      data-ui="form-grid"
                    >
                      <FormField
                        id="height"
                        label="Feet"
                        required
                        error={errors.height}
                      >
                        <TextInput
                          id="height"
                          value={form.height}
                          onChange={(value) => update("height", value)}
                          suffix="ft"
                          error={errors.height}
                        />
                      </FormField>
                      <FormField
                        id="heightInches"
                        label="Inches"
                        required
                        error={errors.heightInches}
                      >
                        <TextInput
                          id="heightInches"
                          value={form.heightInches}
                          onChange={(value) => update("heightInches", value)}
                          suffix="in"
                          error={errors.heightInches}
                        />
                      </FormField>
                    </div>
                  )}
                  {heightConversion ? (
                    <span
                      className="mt-2 block text-[10px] text-teal"
                      aria-live="polite"
                    >
                      Converted value: {heightConversion}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium leading-relaxed text-ink">
                      Weight <span className="text-[#ba7044]">*</span>
                    </span>
                    <div
                      className="inline-flex gap-0.5 rounded-lg border border-line bg-paper p-0.5 [&_button]:min-h-8 [&_button]:min-w-10 [&_button]:cursor-pointer [&_button]:rounded-md [&_button]:px-2.5 [&_button]:text-[11px] [&_button]:font-medium [&_button]:text-muted [&_button]:transition-colors [&_button[aria-pressed=true]]:bg-teal [&_button[aria-pressed=true]]:text-white [&_button[aria-pressed=true]]:shadow-sm"
                      role="group"
                      aria-label="Weight unit"
                    >
                      <button
                        type="button"
                        aria-pressed={form.weightUnit === "kg"}
                        onClick={() => changeWeightUnit("kg")}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        aria-pressed={form.weightUnit === "lb"}
                        onClick={() => changeWeightUnit("lb")}
                      >
                        lb
                      </button>
                    </div>
                  </div>
                  <FormField
                    id="weight"
                    label={`Weight in ${form.weightUnit}`}
                    required
                    hint={
                      form.weightUnit === "kg"
                        ? "Usual range: 25–300 kg."
                        : "Converted to kilograms before analysis."
                    }
                    error={errors.weight}
                  >
                    <TextInput
                      id="weight"
                      value={form.weight}
                      onChange={(value) => update("weight", value)}
                      suffix={form.weightUnit}
                      hintId="weight-hint"
                      error={errors.weight}
                    />
                  </FormField>
                  {weightConversion ? (
                    <span
                      className="mt-2 block text-[10px] text-teal"
                      aria-live="polite"
                    >
                      Converted value: {weightConversion}
                    </span>
                  ) : null}
                </div>
              </div>
              <div
                id="health-metrics"
                className="scroll-mt-6 border-t border-line pt-7"
              >
                <h2 className="mb-2 font-display text-[28px] font-normal tracking-[-0.035em]">
                  Health Measurements
                </h2>
                <p className="mb-6 text-[12px] leading-relaxed text-muted">
                  The readings you know. A little context can make them clearer.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium leading-relaxed text-ink">
                      Blood pressure{" "}
                      <span className="ml-2 text-[10px] font-normal text-soft">
                        Optional
                      </span>
                    </span>
                    <span className="text-[10px] font-medium text-soft">
                      mmHg
                    </span>
                  </div>
                  <p
                    className="mb-4 text-[11px] leading-[1.8] text-muted"
                    data-ui="field-hint"
                  >
                    You can leave both numbers blank and continue. If you enter
                    a reading, include both numbers. Sit quietly if you can. Add
                    up to two more readings to see their average. If the top
                    number is over 180 or the bottom number is over 120, wait
                    one minute and repeat it. If it stays that high, contact a
                    healthcare professional as soon as possible.
                  </p>
                  {form.readings.map((reading, index) => (
                    <div
                      className="mb-4 grid grid-cols-[minmax(0,1fr)_14px_minmax(0,1fr)_32px] items-end gap-2 sm:gap-3 [&_[data-ui~=field-heading]]:min-h-9 [&_[data-ui~=field-heading]]:items-end [&_label]:text-[11px]"
                      key={index}
                    >
                      <span className="col-span-4 mb-1 text-[10px] text-soft">
                        {index === 0
                          ? "First"
                          : `${index + 1}${index === 1 ? "nd" : "rd"}`}{" "}
                        reading
                      </span>
                      <FormField
                        id={`reading${index + 1}Systolic`}
                        label="Top number (systolic)"
                        error={errors[`reading${index + 1}Systolic`]}
                      >
                        <TextInput
                          id={`reading${index + 1}Systolic`}
                          value={reading.systolic}
                          onChange={(value) =>
                            updateRow(index, "systolic", value)
                          }
                          placeholder="120"
                          error={errors[`reading${index + 1}Systolic`]}
                        />
                      </FormField>
                      <span
                        className="pb-3 text-center text-[18px] text-soft"
                        aria-hidden="true"
                      >
                        /
                      </span>
                      <FormField
                        id={`reading${index + 1}Diastolic`}
                        label="Bottom number (diastolic)"
                        error={errors[`reading${index + 1}Diastolic`]}
                      >
                        <TextInput
                          id={`reading${index + 1}Diastolic`}
                          value={reading.diastolic}
                          onChange={(value) =>
                            updateRow(index, "diastolic", value)
                          }
                          placeholder="80"
                          error={errors[`reading${index + 1}Diastolic`]}
                        />
                      </FormField>
                      {index > 0 ? (
                        <button
                          className="w-12 h-12 rounded-[14px] bg-panel inline-flex items-center justify-center cursor-pointer [transition:border-color_0.18s,_color_0.18s] mb-[3px] min-w-12 border border-solid border-line hover:text-teal hover:border-[#9fcab9] max-[561px]:w-11 max-[561px]:[grid-column:4] max-[561px]:[grid-row:2]"
                          type="button"
                          aria-label={`Remove blood-pressure reading ${index + 1}`}
                          onClick={() =>
                            update(
                              "readings",
                              form.readings.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mr-4 inline-flex min-h-9 items-center text-[11px] font-medium text-teal underline underline-offset-4 hover:text-ink"
                    onClick={() => {
                      update("readings", [{ systolic: "", diastolic: "" }]);
                      update("measurementContext", "");
                      setErrors((current) =>
                        Object.fromEntries(
                          Object.entries(current).filter(
                            ([key]) => !/^reading\d+/.test(key),
                          ),
                        ),
                      );
                    }}
                  >
                    Skip / clear BP
                  </button>
                  {form.readings.length < 3 ? (
                    <button
                      className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-medium text-teal hover:underline"
                      type="button"
                      onClick={() =>
                        update("readings", [
                          ...form.readings,
                          { systolic: "", diastolic: "" },
                        ])
                      }
                    >
                      <Plus size={15} />
                      Add another reading
                    </button>
                  ) : null}
                  <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-paper/60 p-4 [&_label]:text-[11px] [&_label]:font-medium [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-panel [&_input]:px-3 [&_input]:text-[12px] [&_input]:text-ink [&_input::placeholder]:text-soft [&_span]:text-[10px] [&_span]:text-soft">
                    <label htmlFor="measurementContext">
                      Anything that may have affected the reading?
                    </label>
                    <input
                      id="measurementContext"
                      maxLength={120}
                      type="text"
                      value={form.measurementContext}
                      placeholder="For example, after coffee, exercise, stress, or talking"
                      onChange={(event) =>
                        update("measurementContext", event.currentTarget.value)
                      }
                    />
                    <span>Optional · max 120 characters</span>
                  </div>
                </div>
                <div>
                  {numericControl("sleepHours", "Average sleep per night", {
                    suffix: "hours",
                    placeholder: "For example, 7.5",
                    hint: "Most adults need around 7–9 hours; needs vary.",
                  })}
                </div>
                {numericControl("restingHeartRate", "Resting heart rate", {
                  suffix: "bpm",
                  optional: true,
                  placeholder: "For example, 68",
                  hint: "Optional. Measure after sitting quietly for a few minutes.",
                })}
              </div>
              <div className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-[11px] leading-relaxed text-muted [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-teal">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>
                  This check-in is for adults (18+). It is general wellness
                  information, not a medical diagnosis.
                </span>
              </div>
            </section>

            <details className="group mb-4 overflow-hidden rounded-xl border border-line bg-paper/20 [&>summary]:flex [&>summary]:min-h-20 [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:gap-3 [&>summary]:p-5 [&>summary::-webkit-details-marker]:hidden [&[open]>summary]:border-b [&[open]>summary]:border-line [&[open]_[data-ui~=summary-chevron]]:rotate-180">
              <summary>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
                  <Activity size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 [&_strong]:block [&_strong]:font-display [&_strong]:text-[21px] [&_strong]:font-normal [&_strong]:leading-tight [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:leading-relaxed [&_small]:text-muted">
                  <span
                    className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-teal"
                    data-ui="eyebrow"
                  >
                    OPTIONAL · HELPS PERSONALIZE
                  </span>
                  <strong>Sleep, movement & daily habits</strong>
                  <small>
                    Share whatever you know. You can skip any of these.
                  </small>
                </span>
                <ChevronDown
                  className="size-[18px] shrink-0 text-soft transition-transform duration-200"
                  data-ui="summary-chevron"
                  size={19}
                  aria-hidden="true"
                />
              </summary>
              <div className="grid gap-6 p-5 [&_[data-ui~=form-grid]]:gap-x-5 [&_[data-ui~=form-grid]]:gap-y-5">
                <div
                  className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
                  data-ui="form-grid"
                >
                  {selectControl(
                    "sleepQuality",
                    "How restful has your sleep felt?",
                    [
                      { value: "", label: "Not sure / skip" },
                      ...[1, 2, 3, 4, 5].map((v) => ({
                        value: String(v),
                        label: `${v} — ${v === 1 ? "Not restful" : v === 5 ? "Very restful" : "In between"}`,
                      })),
                    ],
                    {
                      optional: true,
                      hint: "1 = not restful · 5 = very restful",
                    },
                  )}
                  <div className="sm:col-span-2">
                    <fieldset className="m-0 min-w-0 border-0 p-0 [&_legend]:mb-3 [&_legend]:flex [&_legend]:w-full [&_legend]:items-baseline [&_legend]:justify-between [&_legend]:gap-3 [&_legend]:text-[13px] [&_legend]:font-medium">
                      <legend>
                        Sleep details{" "}
                        <span className="text-[11px] font-normal text-soft">
                          Optional
                        </span>
                      </legend>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {(
                          [
                            ["wakeUps", "I wake up during the night"],
                            ["snores", "I snore"],
                            [
                              "wakeUnrefreshed",
                              "I wake up feeling unrefreshed",
                            ],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]"
                            key={key}
                          >
                            <input
                              className="peer sr-only! appearance-none"
                              type="checkbox"
                              checked={form[key]}
                              onChange={(event) =>
                                update(key, event.currentTarget.checked)
                              }
                            />
                            <span
                              className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                              data-ui="custom-check"
                              aria-hidden="true"
                            >
                              <Check
                                className="size-3 opacity-0 transition-opacity"
                                aria-hidden="true"
                              />
                            </span>
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  {numericControl("activityMinutes", "Physical activity", {
                    suffix: "min / week",
                    optional: true,
                    placeholder: "For example, 120",
                  })}
                  {numericControl("sittingHours", "Time sitting", {
                    suffix: "hours / day",
                    optional: true,
                    placeholder: "For example, 8",
                  })}
                  {numericControl("waterGlasses", "Water intake", {
                    suffix: "glasses / day",
                    optional: true,
                    placeholder: "For example, 6",
                  })}
                  {numericControl("caffeineCups", "Caffeine", {
                    suffix: "cups / day",
                    optional: true,
                    placeholder: "For example, 2",
                  })}
                  {selectControl(
                    "stress",
                    "Stress level",
                    [
                      { value: "", label: "Skip" },
                      ...[1, 2, 3, 4, 5].map((v) => ({
                        value: String(v),
                        label: `${v} / 5`,
                      })),
                    ],
                    { optional: true, hint: "1 = low · 5 = high" },
                  )}
                  {selectControl(
                    "mood",
                    "Mood lately",
                    [
                      { value: "", label: "Skip" },
                      ...[1, 2, 3, 4, 5].map((v) => ({
                        value: String(v),
                        label: `${v} / 5`,
                      })),
                    ],
                    { optional: true, hint: "1 = low · 5 = good" },
                  )}
                  {selectControl(
                    "region",
                    "Background for BMI reference",
                    [
                      {
                        value: "unspecified",
                        label: "Not provided — use general reference",
                      },
                      { value: "south-asian", label: "South Asian" },
                      { value: "east-asian", label: "East Asian" },
                      { value: "other", label: "Another background" },
                    ],
                    {
                      optional: true,
                      hint: "Only used to choose a reference range; it’s okay to skip.",
                    },
                  )}
                  {numericControl("waistCm", "Waist circumference", {
                    suffix: "cm",
                    optional: true,
                    placeholder: "For example, 82",
                  })}
                  <div className="sm:col-span-2">
                    <fieldset className="m-0 min-w-0 border-0 p-0 [&_legend]:mb-3 [&_legend]:flex [&_legend]:w-full [&_legend]:items-baseline [&_legend]:justify-between [&_legend]:gap-3 [&_legend]:text-[13px] [&_legend]:font-medium">
                      <legend>
                        More context{" "}
                        <span className="text-[11px] font-normal text-soft">
                          Optional
                        </span>
                      </legend>
                      <label className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]">
                        <input
                          className="peer sr-only! appearance-none"
                          type="checkbox"
                          checked={form.muscularBuild}
                          onChange={(event) =>
                            update("muscularBuild", event.currentTarget.checked)
                          }
                        />
                        <span
                          className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                          data-ui="custom-check"
                          aria-hidden="true"
                        >
                          <Check
                            className="size-3 opacity-0 transition-opacity"
                            aria-hidden="true"
                          />
                        </span>
                        <span>I train regularly / have a muscular build</span>
                      </label>
                      <label className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]">
                        <input
                          className="peer sr-only! appearance-none"
                          type="checkbox"
                          checked={form.shiftWorkerOrNewParent}
                          onChange={(event) =>
                            update(
                              "shiftWorkerOrNewParent",
                              event.currentTarget.checked,
                            )
                          }
                        />
                        <span
                          className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                          data-ui="custom-check"
                          aria-hidden="true"
                        >
                          <Check
                            className="size-3 opacity-0 transition-opacity"
                            aria-hidden="true"
                          />
                        </span>
                        <span>I work shifts or care for a new baby</span>
                      </label>
                      <label className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]">
                        <input
                          className="peer sr-only! appearance-none"
                          type="checkbox"
                          checked={form.fatigueTwoWeeks}
                          onChange={(event) =>
                            update(
                              "fatigueTwoWeeks",
                              event.currentTarget.checked,
                            )
                          }
                        />
                        <span
                          className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                          data-ui="custom-check"
                          aria-hidden="true"
                        >
                          <Check
                            className="size-3 opacity-0 transition-opacity"
                            aria-hidden="true"
                          />
                        </span>
                        <span>
                          I’ve felt unusually tired for more than two weeks
                        </span>
                      </label>
                    </fieldset>
                  </div>
                </div>
              </div>
            </details>

            <details className="group mb-4 overflow-hidden rounded-xl border border-line bg-paper/20 [&>summary]:flex [&>summary]:min-h-20 [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:gap-3 [&>summary]:p-5 [&>summary::-webkit-details-marker]:hidden [&[open]>summary]:border-b [&[open]>summary]:border-line [&[open]_[data-ui~=summary-chevron]]:rotate-180">
              <summary>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
                  <CircleHelp size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 [&_strong]:block [&_strong]:font-display [&_strong]:text-[21px] [&_strong]:font-normal [&_strong]:leading-tight [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:leading-relaxed [&_small]:text-muted">
                  <span
                    className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-teal"
                    data-ui="eyebrow"
                  >
                    OPTIONAL · SKIP ANYTHING
                  </span>
                  <strong>Symptoms & other context</strong>
                  <small>
                    These details can help shape the plain-language report.
                  </small>
                </span>
                <ChevronDown
                  className="size-[18px] shrink-0 text-soft transition-transform duration-200"
                  data-ui="summary-chevron"
                  size={19}
                  aria-hidden="true"
                />
              </summary>
              <div className="grid gap-6 p-5 [&_[data-ui~=form-grid]]:gap-x-5 [&_[data-ui~=form-grid]]:gap-y-5">
                <fieldset className="m-0 min-w-0 border-0 p-0 [&_legend]:mb-3 [&_legend]:flex [&_legend]:w-full [&_legend]:items-baseline [&_legend]:justify-between [&_legend]:gap-3 [&_legend]:text-[13px] [&_legend]:font-medium">
                  <legend>
                    Current or new symptoms{" "}
                    <span className="text-[11px] font-normal text-soft">
                      Optional
                    </span>
                  </legend>
                  <p className="text-[12px] leading-relaxed text-muted">
                    Use these for current or new, unexplained symptoms. Sudden
                    chest pain, severe breathlessness, or stroke-like symptoms
                    need immediate care even if your readings look usual. This
                    checklist cannot rule out an emergency or interpret symptoms
                    described only in your note.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {symptomOptions.map(([key, label]) => (
                      <label
                        className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]"
                        key={key}
                      >
                        <input
                          className="peer sr-only! appearance-none"
                          type="checkbox"
                          checked={form.symptoms.includes(key)}
                          onChange={(event) =>
                            update(
                              "symptoms",
                              event.currentTarget.checked
                                ? [...form.symptoms, key]
                                : form.symptoms.filter((item) => item !== key),
                            )
                          }
                        />
                        <span
                          className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                          data-ui="custom-check"
                          aria-hidden="true"
                        >
                          <Check
                            className="size-3 opacity-0 transition-opacity"
                            aria-hidden="true"
                          />
                        </span>
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div
                  className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
                  data-ui="form-grid"
                >
                  {selectControl(
                    "pregnantOrBreastfeeding",
                    "Pregnancy or breastfeeding",
                    [
                      { value: "", label: "Prefer not to say / skip" },
                      { value: "no", label: "No" },
                      { value: "pregnant", label: "Pregnant" },
                      { value: "breastfeeding", label: "Breastfeeding" },
                    ],
                    { optional: true },
                  )}
                  {selectControl(
                    "medication",
                    "Taking regular medication?",
                    [
                      { value: "", label: "Skip" },
                      { value: "no", label: "No" },
                      { value: "yes", label: "Yes" },
                    ],
                    {
                      optional: true,
                      hint: "Please don’t enter names or doses.",
                    },
                  )}
                  {selectControl(
                    "smoking",
                    "Smoking",
                    [
                      { value: "", label: "Skip" },
                      { value: "no", label: "No" },
                      { value: "some-days", label: "Some days" },
                      { value: "daily", label: "Daily" },
                    ],
                    { optional: true },
                  )}
                  {selectControl(
                    "alcohol",
                    "Alcohol",
                    [
                      { value: "", label: "Skip" },
                      { value: "none", label: "None" },
                      { value: "occasional", label: "Occasional" },
                      { value: "regular", label: "Regular" },
                    ],
                    { optional: true },
                  )}
                </div>
                <fieldset className="m-0 min-w-0 border-0 border-t border-line pt-5 [&_legend]:mb-3 [&_legend]:flex [&_legend]:w-full [&_legend]:items-baseline [&_legend]:justify-between [&_legend]:text-[13px] [&_legend]:font-medium">
                  <legend>
                    Known health conditions{" "}
                    <span className="text-[11px] font-normal text-soft">
                      Optional
                    </span>
                  </legend>
                  {checkBox(conditionOptions, form.conditions, "conditions")}
                </fieldset>
                <FormField
                  id="notes"
                  label="Anything else you’d like us to know?"
                  optional
                  hint="Optional. Your note is used only for a local safety check and is not included in your report."
                >
                  <TextInput
                    id="notes"
                    value={form.notes}
                    onChange={(value) => update("notes", value)}
                    type="textarea"
                    maxLength={300}
                    inputMode="text"
                    hintId="notes-hint"
                  />
                  <span className="block text-right text-[13px] text-soft mt-1.5">
                    {form.notes.length}/300
                  </span>
                </FormField>
              </div>
            </details>

            <details className="group mb-4 overflow-hidden rounded-xl border border-line bg-paper/20 [&>summary]:flex [&>summary]:min-h-20 [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:gap-3 [&>summary]:p-5 [&>summary::-webkit-details-marker]:hidden [&[open]>summary]:border-b [&[open]>summary]:border-line [&[open]_[data-ui~=summary-chevron]]:rotate-180">
              <summary>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
                  <HeartPulse size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 [&_strong]:block [&_strong]:font-display [&_strong]:text-[21px] [&_strong]:font-normal [&_strong]:leading-tight [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:leading-relaxed [&_small]:text-muted">
                  <span
                    className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-teal"
                    data-ui="eyebrow"
                  >
                    OPTIONAL · LAB REPORTS ONLY
                  </span>
                  <strong>Blood sugar & other test results</strong>
                  <small>
                    You can skip these. Use the value and unit shown on a recent
                    lab report.
                  </small>
                </span>
                <ChevronDown
                  className="size-[18px] shrink-0 text-soft transition-transform duration-200"
                  data-ui="summary-chevron"
                  size={19}
                  aria-hidden="true"
                />
              </summary>
              <div className="grid gap-6 p-5 [&_[data-ui~=form-grid]]:gap-x-5 [&_[data-ui~=form-grid]]:gap-y-5">
                <div className="sm:col-span-2">
                  <p>
                    These ranges are screening context, not a diagnosis. Do not
                    use a home glucose meter result for lab-range
                    interpretation.
                  </p>
                  <a
                    href="https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis"
                    target="_blank"
                    rel="noreferrer"
                  >
                    See how clinicians use glucose tests
                  </a>
                </div>
                <div
                  className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
                  data-ui="form-grid"
                >
                  {selectControl(
                    "glucoseTestType",
                    "Blood sugar test type",
                    [
                      { value: "", label: "Skip this test" },
                      {
                        value: "fasting",
                        label: "Fasting laboratory glucose (8+ hour fast)",
                      },
                      {
                        value: "hba1c",
                        label: "HbA1c from a laboratory report",
                      },
                      {
                        value: "other",
                        label: "Home meter, other test, or not sure",
                      },
                    ],
                    {
                      optional: true,
                      hint: "Choose the test on your report. Home-meter results receive no diabetes screening label; low or very high values still show safety guidance.",
                      onChange: (value) =>
                        updateForm({
                          ...form,
                          glucoseTestType: value as FormData["glucoseTestType"],
                          glucoseUnit:
                            value === "hba1c"
                              ? "%"
                              : form.glucoseUnit === "%"
                                ? "mg/dL"
                                : form.glucoseUnit,
                          glucoseFastingConfirmed: false,
                        }),
                    },
                  )}
                  {form.glucoseTestType ? (
                    <>
                      {numericControl(
                        "glucoseValue",
                        form.glucoseTestType === "hba1c"
                          ? "HbA1c result"
                          : "Blood glucose result",
                        {
                          suffix:
                            form.glucoseTestType === "hba1c"
                              ? "%"
                              : form.glucoseUnit,
                          optional: true,
                          placeholder:
                            form.glucoseTestType === "hba1c"
                              ? "For example, 5.6"
                              : "Enter the result from the report",
                          hint:
                            form.glucoseTestType === "fasting"
                              ? "Fasting means no food for at least 8 hours; water is okay."
                              : undefined,
                        },
                      )}
                      {form.glucoseTestType !== "hba1c" ? (
                        <FormField
                          id="glucoseUnit"
                          label="Unit shown on report"
                          optional
                          hint="Select the same unit printed on the result."
                        >
                          <SelectField
                            id="glucoseUnit"
                            value={
                              form.glucoseUnit === "%"
                                ? "mg/dL"
                                : form.glucoseUnit
                            }
                            options={[
                              { value: "mg/dL", label: "mg/dL" },
                              { value: "mmol/L", label: "mmol/L" },
                            ]}
                            onChange={(value) => update("glucoseUnit", value)}
                            labelId="glucoseUnit-label"
                            describedBy="glucoseUnit-hint"
                          />
                        </FormField>
                      ) : (
                        <p className="self-end min-h-13.5 flex items-center text-muted text-[12px] m-0">
                          Unit: percent (%) · HbA1c
                        </p>
                      )}
                      {form.glucoseTestType === "fasting" ? (
                        <label className="relative flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-paper/20 px-3 py-2.5 text-[12px] leading-relaxed text-ink transition-colors hover:border-[#a9cabc]">
                          <input
                            className="peer sr-only! appearance-none"
                            type="checkbox"
                            checked={form.glucoseFastingConfirmed}
                            onChange={(event) =>
                              update(
                                "glucoseFastingConfirmed",
                                event.currentTarget.checked,
                              )
                            }
                          />
                          <span
                            className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-[#c9d9d0] bg-panel text-white peer-checked:border-teal peer-checked:bg-teal peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-3 peer-focus-visible:outline-[#58b9a3] peer-focus-visible:outline-offset-3"
                            data-ui="custom-check"
                            aria-hidden="true"
                          >
                            <Check
                              className="size-3 opacity-0 transition-opacity"
                              aria-hidden="true"
                            />
                          </span>
                          <span>
                            I had not eaten for at least 8 hours before this lab
                            test (water is okay).
                          </span>
                        </label>
                      ) : null}
                    </>
                  ) : null}
                  {numericControl("hemoglobin", "Hemoglobin", {
                    suffix: "g/dL",
                    optional: true,
                    placeholder: "Optional",
                  })}
                  <div className="flex items-end gap-3 [&>[data-ui~=field]]:min-w-0 [&>[data-ui~=field]]:flex-1">
                    <FormField
                      id="cholesterol"
                      label="Cholesterol"
                      optional
                      error={errors.cholesterol}
                    >
                      <TextInput
                        id="cholesterol"
                        value={form.cholesterol}
                        onChange={(value) => update("cholesterol", value)}
                        placeholder="Optional"
                        error={errors.cholesterol}
                      />
                    </FormField>
                    <SelectField
                      id="cholesterolUnit"
                      className="w-[145px]! shrink-0 max-[561px]:w-[130px]!"
                      value={form.cholesterolUnit}
                      options={[
                        { value: "mg/dL", label: "mg/dL" },
                        { value: "mmol/L", label: "mmol/L" },
                      ]}
                      onChange={(value) => update("cholesterolUnit", value)}
                      ariaLabel="Cholesterol unit"
                    />
                  </div>
                </div>
                <p className="text-[#53655d] text-[11px] leading-[1.6] mt-[3px] mb-0 mx-0">
                  Known diabetes, pregnancy, anemia, or personal treatment goals
                  can change what a test means. One result cannot diagnose a
                  condition; your clinician may repeat or confirm testing.
                </p>
              </div>
            </details>

            <div className="mt-8 border-t border-line pt-7 text-center">
              {Object.keys(errors).length > 0 ? (
                <p
                  className="flex items-start bg-amber-bg rounded-[12px] text-amber text-[12px] leading-[1.5] mt-2.5 mb-0 mx-0 px-[15px] py-3.5 gap-2.5"
                  role="alert"
                >
                  Please check the highlighted fields above.
                </p>
              ) : null}
              <button
                className="group inline-flex min-h-12 min-w-[250px] items-center justify-center gap-3 rounded-[9px] bg-teal px-7 text-[13px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-strong disabled:translate-y-0 dark:bg-teal-strong"
                data-ui="button button-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="w-5 h-5 [border-top-color:white] [border-right-color:rgba(255,_255,_255,_0.35)] [border-bottom-color:rgba(255,_255,_255,_0.35)] [border-left-color:rgba(255,_255,_255,_0.35)] rounded-full animate-[spin_0.7s_linear_infinite] border-2 border-solid"
                      aria-hidden="true"
                    />
                    Analyzing your numbers…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    See my check-in <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
              <p className="text-soft text-[11px] mt-3 mb-0 leading-[1.5] mx-0">
                {submitting
                  ? "Your answers stay in this browser."
                  : "No account needed · AI chat is optional and separate"}
              </p>
            </div>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 text-[10px] text-muted">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole size={13} className="text-teal" />
              Your check-in is calculated on this device.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity size={12} className="text-teal" />A few minutes, just
              for you.
            </span>
          </div>
        </div>
        <CheckInSidebar onPrivacy={onPrivacy} />
      </div>
    </main>
  );
}
