import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Heart,
  HeartPulse,
  Moon,
  Printer,
  Sparkles,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Waves,
} from "lucide-react";
import type { WellnessReport } from "../domain/types";
import { DISCLAIMER } from "../domain/constants";
import { BLOOD_TYPE_SOURCES } from "../domain/bloodType";
import { formatMeasurement } from "../domain/format";
import { CLINICAL_SOURCES, glucoseTestLabel } from "../domain/clinicalGuidance";
import { buildReportText } from "../lib/summary";
import { downloadReportPDF, preloadReportPDF } from "../lib/pdf";
import { CheckInProgress } from "./CheckInProgress";
import { MetricCard } from "./MetricCard";

interface Props {
  report: WellnessReport;
  onStartOver: () => void;
  onOpenChat: () => void;
}
const number = formatMeasurement;

function getScreeningSnapshot(report: WellnessReport) {
  const checks = [
    {
      assessed: report.bp.category !== "Not assessed",
      inRange: report.bp.category === "Normal",
    },
    {
      assessed: report.bmi.category !== "Not assessed",
      inRange: report.bmi.category === "Normal",
    },
    {
      assessed: true,
      inRange: report.sleep.category === "Recommended range",
    },
    {
      assessed: report.heartRate !== undefined,
      inRange: report.heartRate?.category === "Usual range",
    },
    {
      assessed:
        report.glucose !== undefined &&
        report.glucose.category !== "Shown without interpretation",
      inRange: report.glucose?.category === "Below common screening cutoff",
    },
  ].filter((check) => check.assessed);

  const inRange = checks.filter((check) => check.inRange).length;
  const total = checks.length;
  const percentage = total === 0 ? 0 : Math.round((inRange / total) * 100);
  const tone = percentage < 50 ? "red" : percentage < 85 ? "amber" : "green";

  return { inRange, total, percentage, tone };
}

function StatusMark({
  label,
  urgent = false,
}: {
  label: string;
  urgent?: boolean;
}) {
  return (
    <span
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-teal-tint px-3 py-1.5 text-[11px] font-medium text-teal data-[tone=watch]:border-[#eadbc0] data-[tone=watch]:bg-amber-bg data-[tone=watch]:text-amber [&[data-tone=watch]_[data-ui~=status-dot]]:bg-amber data-[urgent=true]:border-[#963b33] data-[urgent=true]:bg-[#963b33] data-[urgent=true]:text-white [&[data-urgent=true]_[data-ui~=status-dot]]:bg-white"
      data-urgent={urgent || undefined}
      data-tone={
        !urgent && label !== "No automatic flags" ? "watch" : undefined
      }
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-[#4f9d76]"
        data-ui="status-dot"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function ResultsView({ report, onStartOver, onOpenChat }: Props) {
  const [copyNotice, setCopyNotice] = useState("");
  const [pdfNotice, setPdfNotice] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { inputs: i, safety } = report;
  const screeningSnapshot = getScreeningSnapshot(report);
  const urgent = safety.urgent;
  const bpTone =
    report.bp.category === "Not assessed"
      ? "neutral"
      : report.bp.category === "Normal"
        ? "calm"
        : "watch";
  const bmiTone =
    report.bmi.category === "Normal"
      ? "calm"
      : report.bmi.category === "Not assessed"
        ? "neutral"
        : "watch";
  const sleepTone =
    report.sleep.category === "Recommended range"
      ? "calm"
      : report.sleep.category === "Long"
        ? "watch"
        : "watch";
  const hrTone =
    !report.heartRate || report.heartRate.category === "Usual range"
      ? "calm"
      : "watch";
  const glucoseTone =
    report.glucose?.category === "Below common screening cutoff"
      ? "calm"
      : report.glucose?.category === "Shown without interpretation"
        ? "neutral"
        : "watch";

  useEffect(() => {
    let active = true;
    void preloadReportPDF().catch(() => {
      if (active)
        setPdfNotice(
          "PDF download is not available in this browser. You can still use Print / Save as PDF or Copy summary.",
        );
    });
    return () => {
      active = false;
    };
  }, []);

  async function copySummary() {
    const text = buildReportText(report);
    try {
      await navigator.clipboard.writeText(text);
      setCopyNotice("Your summary was copied.");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      setCopyNotice(
        copied
          ? "Your summary was copied."
          : "Copy wasnâ€™t available. You can still print or save the report.",
      );
    }
    window.setTimeout(() => setCopyNotice(""), 4500);
  }

  async function downloadPDF() {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfNotice("Preparing your reportâ€¦");
    try {
      await downloadReportPDF(report);
      setPdfNotice(
        "Your PDF was prepared. If you donâ€™t see it in Downloads, use Print / Save as PDF to save a copy.",
      );
    } catch {
      setPdfNotice(
        "The automatic download did not work. Use Print / Save as PDF or Copy summary instead.",
      );
    } finally {
      setPdfBusy(false);
    }
  }

  if (urgent) {
    return (
      <main
        className="mx-auto w-[calc(100%_-_48px)] max-w-[760px] py-14 [&_h1]:mt-6 [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-[clamp(36px,5vw,52px)] [&_h1]:font-normal [&_h1]:leading-tight [&_h1]:tracking-[-0.04em] [&_h1]:text-red print:w-full print:py-0"
        aria-labelledby="urgent-heading"
      >
        <div className="w-16.5 h-16.5 rounded-[19px] grid place-items-center bg-[#963b33] text-[#fff] mb-5.5">
          <ShieldAlert size={34} aria-hidden="true" />
        </div>
        <span
          className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
          data-ui="eyebrow"
        >
          PLEASE FOCUS ON GETTING CARE
        </span>
        <StatusMark label="Urgent" urgent />
        <h1 id="urgent-heading">
          Seek emergency care / call your local emergency number now.
        </h1>
        <p className="text-[14px] leading-[1.7] text-muted max-w-155">
          One or more details you entered can need urgent attention. This tool
          canâ€™t assess an emergency or tell you the cause.
        </p>
        <ul className="grid text-[#713832] bg-red-bg rounded-[13px] pr-5.5 pl-10.5 text-[13px] leading-[1.55] py-[19px] border border-solid border-[#f0d6d1] gap-2.5 dark:text-[#f1c2ba] dark:bg-[#382624] dark:border-[#5b3530]">
          {safety.urgentReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p className="text-[14px] leading-[1.7] font-medium text-ink mt-5.5 mb-4.5 mx-0">
          Please do not wait for this app to decide what is happening. Contact
          local emergency services or go to the nearest emergency department
          now. Do not drive yourself if you may be having a medical emergency.
        </p>
        <p className="max-w-160 text-muted text-[12px] leading-[1.6] border-t [border-top-style:solid] [border-top-color:var(--line)] pt-3.5 mx-0 my-5">
          {DISCLAIMER}
        </p>
        <button
          className="border-line bg-panel text-teal hover:border-teal inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 disabled:translate-y-0 print:hidden"
          data-ui="button"
          type="button"
          onClick={onStartOver}
        >
          <ArrowLeft size={18} />
          Start over
        </button>
      </main>
    );
  }

  return (
    <main
      className="mx-auto w-[calc(100%_-_48px)] max-w-[1144px] pt-10 pb-14 sm:w-[calc(100%_-_80px)] lg:w-[calc(100%_-_96px)] print:w-full print:max-w-none print:p-0"
      aria-labelledby="results-heading"
    >
      <CheckInProgress complete />
      {safety.glucoseConcern && report.glucose ? (
        <section
          role="alert"
          aria-label="Glucose safety guidance"
          className="mb-7 rounded-xl border-2 border-amber/50 bg-amber-bg p-6 text-[13px] leading-relaxed text-ink"
        >
          <h2 className="mb-3 font-display text-[28px]">
            Please check this glucose result promptly
          </h2>
          <p>{report.glucose.note}</p>
          <p className="mb-0 font-medium">{report.glucose.tip}</p>
        </section>
      ) : null}
      {safety.crisisBloodPressure ? (
        <section
          className="mb-7 grid gap-4 rounded-xl border-2 border-[#b87e22] bg-[#fff8e9] p-6 text-[#302a20] sm:grid-cols-[44px_minmax(0,1fr)] [&_h2]:my-2 [&_h2]:font-display [&_h2]:text-[28px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:text-[#362c1b] [&_p]:my-3 [&_p]:text-[13px] [&_p]:leading-[1.8] [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:text-[12px] [&_a]:font-semibold [&_a]:text-[#63400c] [&_a]:underline [&_a]:underline-offset-4 dark:border-[#876a32] dark:bg-[#342c1c] dark:text-ink dark:[&_h2]:text-[#f2dfb0] dark:[&_a]:text-[#eed28f]"
          role="alert"
          aria-labelledby="bp-critical-title"
        >
          <div className="w-12 h-12 grid place-items-center rounded-[14px] text-[#fff] bg-[#8a5c16]">
            <ShieldAlert size={24} aria-hidden="true" />
          </div>
          <div>
            <span
              className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
              data-ui="eyebrow"
            >
              PLEASE READ FIRST Â· VERY HIGH READING
            </span>
            <h2 id="bp-critical-title">
              Repeat once, then get medical advice if it stays high.
            </h2>
            <p>{report.bp.note}</p>
            <p className="font-bold" data-ui="critical-action">
              If you have chest pain, shortness of breath, back pain, numbness,
              weakness, confusion, a severe headache, vision changes, or
              difficulty speaking, call your local emergency number now.
            </p>
            <a href={CLINICAL_SOURCES[1].url} target="_blank" rel="noreferrer">
              American Heart Association guidance
            </a>
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-4.5 [&_[data-ui~=intro-kicker]]:text-[13px] max-[561px]:flex-wrap max-[561px]:gap-[11px] max-[561px]:[&_[data-ui~=intro-kicker]]:text-[10px] max-[561px]:[&_[data-ui~=intro-kicker]]:gap-[7px] max-[561px]:[&_[data-ui~=step-line]]:w-[17px] print:[&>[data-ui~=intro-kicker]]:hidden!">
        <div
          className="flex items-center text-muted text-[13px] font-bold tracking-[0.09em] gap-[13px] max-[561px]:text-[11px] max-[561px]:gap-2"
          data-ui="intro-kicker"
        >
          <span className="w-10.5 h-10.5 rounded-full bg-teal-tint text-teal grid place-items-center text-[13px] tracking-0 max-[561px]:w-9 max-[561px]:h-9 max-[561px]:text-[13px]">
            02
          </span>
          <span>YOUR CHECK-IN</span>
          <span className="h-px w-11.5 bg-line" data-ui="step-line" />
          <span>PRIVATE ON THIS DEVICE</span>
        </div>
        <StatusMark label={report.status} />
      </div>
      <motion.section
        className="my-7 grid items-center gap-7 rounded-2xl border border-line bg-panel p-6 shadow-panel sm:p-9 lg:grid-cols-[minmax(0,1fr)_290px] [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-[clamp(38px,4vw,55px)] [&_h1]:font-normal [&_h1]:leading-[1.08] [&_h1]:tracking-[-0.045em] [&_h1_em]:font-normal [&_h1_em]:text-teal [&>div>p]:text-[14px] [&>div>p]:leading-[1.8] [&>div>p]:text-muted print:break-inside-avoid print:shadow-none"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: "easeOut",
        }}
      >
        <div>
          <span
            className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
            data-ui="eyebrow"
          >
            A MOMENT FOR YOU
          </span>
          <h1 id="results-heading">
            Here's what your <em>check-in</em> shows.
          </h1>
          <p className="max-w-125 mt-0! mb-4! text-[15px]! mx-0! max-[561px]:text-[14px]!">
            {report.summary}
          </p>
          <p className="flex items-start text-muted text-[13px]! leading-[1.55]! m-0! gap-[7px] [&_svg]:flex-none [&_svg]:text-teal [&_svg]:mt-px">
            <ShieldAlert size={18} aria-hidden="true" />
            Educational context only. This check-in cannot measure health or
            energy, diagnose illness, or rule out an emergency.
          </p>
        </div>
        <aside className="flex flex-col items-center rounded-xl bg-teal-tint p-6 text-center">
          <span className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            Screening snapshot
          </span>
          <div
            className="relative mb-4 grid size-36 place-items-center"
            role="img"
            aria-label={`${screeningSnapshot.percentage}% of assessed screening indicators are in the tool's usual ranges`}
          >
            <svg
              className="size-full -rotate-90"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--line)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={
                  screeningSnapshot.tone === "red"
                    ? "#c4554c"
                    : screeningSnapshot.tone === "amber"
                      ? "#bb8a35"
                      : "#348b69"
                }
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(screeningSnapshot.percentage / 100) * 314.16} 314.16`}
                className="transition-[stroke-dasharray] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[38px] leading-none text-ink">
                {screeningSnapshot.percentage}%
              </span>
              <span className="mt-1 text-[11px] font-medium text-muted">
                in usual range
              </span>
            </div>
          </div>
          <h2 className="mb-2 font-display text-[25px] leading-tight">
            {screeningSnapshot.inRange} of {screeningSnapshot.total} checks in
            range
          </h2>
          <p className="mb-0 text-[12px] leading-relaxed text-muted">
            Based only on the screening indicators assessed here. This is not an
            overall health score or diagnosis; symptoms and your clinician’s
            advice take priority.
          </p>
        </aside>
      </motion.section>

      {report.context.bloodPressureMissing ? (
        <section
          aria-label="Report limitation: missing blood pressure"
          className="my-6 rounded-xl border border-amber/25 bg-amber-bg p-6 text-[13px] leading-relaxed text-ink"
        >
          <h2 className="mb-2 font-display text-[26px]">
            Confidence: lower BP not assessed
          </h2>
          <p className="mb-0">{report.context.bloodPressureNote}</p>
        </section>
      ) : null}

      {report.bloodType ? (
        <section
          aria-label="Blood type context"
          className="my-6 rounded-xl border border-line bg-panel p-6 text-[13px] leading-relaxed text-muted"
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-teal-tint px-3 py-1 text-[12px] font-semibold text-teal">
              {report.bloodType.value === "unknown"
                ? "Blood type unknown"
                : `Blood type ${report.bloodType.value.replace("-", "âˆ’")}`}
            </span>
            <h2 className="font-display text-[27px] text-ink">
              Your blood type, in context
            </h2>
          </div>
          <p>{report.bloodType.note}</p>
          {report.bloodType.maternityNote ? (
            <p className="rounded-lg bg-teal-tint p-4 text-ink">
              {report.bloodType.maternityNote}
            </p>
          ) : null}
          <p className="mb-3">{report.bloodType.tip}</p>
          <a
            className="inline-flex min-h-10 items-center text-[12px] font-medium text-teal underline underline-offset-4"
            href={
              report.bloodType.maternityNote
                ? BLOOD_TYPE_SOURCES[1].url
                : BLOOD_TYPE_SOURCES[0].url
            }
            target="_blank"
            rel="noreferrer"
          >
            Read NHS blood-group guidance â†—
          </a>
        </section>
      ) : null}

      {safety.medicalReview ? (
        <section
          className="my-6 flex items-start gap-4 rounded-xl border border-[#e8d8b8] bg-[#faf7ee] p-6 dark:border-[#51442a] dark:bg-[#332d20] [&_h2]:my-2 [&_h2]:font-display [&_h2]:text-[24px] [&_h2]:font-normal [&_p]:m-0 [&_p]:text-[13px] [&_p]:leading-[1.85] [&_p]:text-muted"
          aria-labelledby="care-title"
        >
          <div
            className="flex-none w-12 h-12 rounded-[14px] bg-[#f0e7ce] text-[#8b621f] grid place-items-center dark:bg-[#493d24] dark:text-[#e2bf74]"
            data-ui="care-icon"
          >
            <Stethoscope size={25} aria-hidden="true" />
          </div>
          <div>
            <span
              className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
              data-ui="eyebrow"
            >
              A GENTLE NEXT STEP
            </span>
            <h2 id="care-title">Consider checking in with a doctor</h2>
            <p>
              It may help to talk through how youâ€™ve been feeling and what
              these readings mean for you. Some checks doctors may consider
              include a blood count, thyroid, or blood sugar. This is a
              conversation starterâ€”not a conclusion.
            </p>
          </div>
        </section>
      ) : null}

      {i.conditions.length > 0 || i.medication === "yes" ? (
        <p className="flex items-start text-muted text-[13px] leading-[1.6] bg-teal-tint rounded-[13px] mx-0 my-[15px] px-4.5 py-4 gap-3 [&_svg]:flex-none [&_svg]:text-teal dark:bg-[#203a30]">
          <HeartPulse size={18} aria-hidden="true" />
          Your doctorâ€™s personal targets may differ. Some medicines can also
          change blood-pressure or heart-rate readings.
        </p>
      ) : null}
      {safety.disorderedEatingConcern ? (
        <section className="flex rounded-[16px] bg-[#eff6f1] text-ink mx-0 my-[21px] px-6 py-5.5 border border-solid border-[#d7e7dd] gap-4.5 [&_h2]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[1.3] [&_h2]:font-display [&_h2]:mx-0 [&_h2]:my-[5px] [&_p]:text-[13px] [&_p]:leading-[1.6] [&_p]:text-muted [&_p]:max-w-175 [&_p]:m-0 [&_[data-ui~=care-icon]]:text-teal [&_[data-ui~=care-icon]]:bg-[#dfeee5] dark:bg-[#20352d] dark:border-[#344e41] dark:[&_[data-ui~=care-icon]]:text-[#9ad5b4] dark:[&_[data-ui~=care-icon]]:bg-[#2c493b] print:shadow-none print:break-inside-avoid">
          <div
            className="flex-none w-12 h-12 rounded-[14px] bg-[#f0e7ce] text-[#8b621f] grid place-items-center dark:bg-[#493d24] dark:text-[#e2bf74]"
            data-ui="care-icon"
          >
            <Heart size={24} aria-hidden="true" />
          </div>
          <div>
            <span
              className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
              data-ui="eyebrow"
            >
              YOU DESERVE SUPPORT
            </span>
            <h2>Be gentle with yourself</h2>
            <p>
              Worries about food or your body can feel heavy. You donâ€™t have
              to manage that alone; consider talking with a health professional
              or someone you trust. This report does not set diet, weight, or
              calorie targets.
            </p>
          </div>
        </section>
      ) : null}
      {i.pregnantOrBreastfeeding === "pregnant" ||
      i.pregnantOrBreastfeeding === "breastfeeding" ? (
        <p className="flex items-start text-muted text-[13px] leading-[1.6] bg-teal-tint rounded-[13px] mx-0 my-[15px] px-4.5 py-4 gap-3 [&_svg]:flex-none [&_svg]:text-teal dark:bg-[#203a30]">
          <Heart size={18} />
          Pregnancy and breastfeeding can change what measurements mean. BMI is
          not assessed here; your care team can offer advice that fits you.
        </p>
      ) : null}

      <section
        className="border-b border-line py-8"
        aria-labelledby="numbers-heading"
      >
        <div className="mb-6 flex items-end justify-between gap-4 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.035em]">
          <div>
            <span
              className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
              data-ui="eyebrow"
            >
              THE NUMBERS, IN CONTEXT
            </span>
            <h2 id="numbers-heading">Your personal snapshot</h2>
          </div>
          <span className="text-[13px] text-soft tracking-[0.09em] max-[561px]:text-[11px]">
            01 / 03
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <MetricCard
            title="Blood pressure"
            value={
              i.systolic !== undefined && i.diastolic !== undefined
                ? `${number(i.systolic)} / ${number(i.diastolic)} mmHg`
                : "Not entered"
            }
            category={report.bp.category}
            note={report.bp.note}
            tip={report.bp.tip}
            icon={<HeartPulse size={20} />}
            tone={bpTone}
          />
          <MetricCard
            title="BMI & waist"
            value={
              report.bmi.category === "Not assessed"
                ? "Not assessed"
                : number(report.bmi.value)
            }
            category={
              report.bmi.category === "Not assessed"
                ? "Pregnancy-specific care"
                : report.bmi.category
            }
            note={`${report.bmi.note}${i.muscularBuild ? " A muscular build can also make BMI less informative." : ""}${i.age >= 65 ? " BMI needs cautious interpretation at 65+, including muscle mass, other conditions and overall function." : ""}`}
            tip={report.bmi.tip}
            icon={<UserRound size={20} />}
            tone={bmiTone}
          />
          <MetricCard
            title="Sleep"
            value={`${number(i.sleepHours)} hours/night`}
            category={report.sleep.category}
            note={report.sleep.note}
            tip={report.sleep.tip}
            icon={<Moon size={20} />}
            tone={sleepTone}
          />
          <MetricCard
            title="Resting heart rate"
            value={
              report.heartRate ? `${i.restingHeartRate} bpm` : "Not entered"
            }
            category={report.heartRate?.category ?? "Optional"}
            note={
              report.heartRate?.note ??
              "This optional detail was not included, so heart rate cannot be part of the snapshot."
            }
            tip={
              report.heartRate?.tip ??
              "If you have a calm, resting measurement, you can include it in another check-in."
            }
            icon={<Activity size={20} />}
            tone={hrTone}
          />
          {report.glucose && i.glucose ? (
            <MetricCard
              title="Blood sugar"
              value={`${number(i.glucose.value)} ${i.glucose.unit}`}
              category={report.glucose.category}
              note={report.glucose.note}
              tip={report.glucose.tip}
              icon={<Activity size={20} />}
              tone={glucoseTone}
            />
          ) : null}
        </div>
        {report.glucose && i.glucose ? (
          <div className="rounded-[13px] text-[13px] leading-[1.6] mt-4 block bg-teal-tint text-ink px-4.5 py-4 border border-solid border-line gap-[11px] [&_a]:text-teal-strong [&_a]:font-bold [&_a]:underline-offset-[3px]">
            <strong>Test entered:</strong>{" "}
            {glucoseTestLabel(i.glucose.testType)}
            {i.glucose.testType === "fasting"
              ? ` Â· ${i.glucose.fastingConfirmed ? "8+ hour fast confirmed" : "fasting not confirmed"}`
              : ""}
            .{" "}
            <a href={CLINICAL_SOURCES[2].url} target="_blank" rel="noreferrer">
              Read NIDDK screening guidance
            </a>
            . This is not a diagnosis, and personal targets may differ.
          </div>
        ) : null}
        {report.waistToHeightRatio !== undefined ? (
          <div
            className="flex items-start rounded-[13px] bg-[#f0f7f2] text-muted text-[13px] leading-[1.6] mt-4 px-4.5 py-4 border border-solid border-[#d5e6dc] gap-[11px] [&_svg]:flex-none [&_svg]:text-teal [&_strong]:text-ink [&[data-watch=true]]:bg-amber-bg [&[data-watch=true]]:border-[#ece2c7] [&[data-watch=true]_svg]:text-[#92631e] dark:bg-[#20372c] dark:border-[#3c5945] dark:[&[data-watch=true]]:bg-[#382f1d] dark:[&[data-watch=true]]:border-[#594929]"
            data-watch={report.waistToHeightRatio >= 0.5 || undefined}
          >
            <Waves size={19} aria-hidden="true" />
            <span>
              <strong>
                Waist-to-height ratio:{" "}
                {formatMeasurement(report.waistToHeightRatio, 3)}
              </strong>{" "}
              Â·{" "}
              {report.waistToHeightRatio >= 0.5
                ? "This is at or above 0.5, a signal that can be worth discussing. Waist measurements can add context beyond BMI."
                : "This is one way to put waist size into context. It is not a diagnosis."}
            </span>
          </div>
        ) : null}
        {i.pregnantOrBreastfeeding !== "pregnant" &&
        i.pregnantOrBreastfeeding !== "breastfeeding" ? (
          <p className="text-[12px] text-muted leading-[1.55] mt-3 mb-0 mx-0">
            BMI can be misleading for athletes or very muscular people, older
            adults who have lost muscle, and during pregnancy. It is only one
            rough measure. Values marked ~ are rounded; categories use unrounded
            values.
          </p>
        ) : null}
        {i.snores && i.wakeUnrefreshed ? (
          <p className="flex items-start text-muted text-[13px] leading-[1.6] bg-teal-tint rounded-[13px] mt-3 mb-[15px] mx-0 px-4.5 py-4 gap-3 [&_svg]:flex-none [&_svg]:text-teal dark:bg-[#203a30]">
            <Moon size={18} />
            Your hours may look adequate, but snoring and waking unrefreshed may
            point to poor-quality sleep. Consider discussing this with a doctor
            if it continues.
          </p>
        ) : null}
      </section>

      {i.hemoglobin !== undefined || i.cholesterol ? (
        <section
          className="rounded-[14px] bg-panel mx-0 my-5 p-5 border border-solid border-line [&_small]:text-soft [&_small]:text-[12px] [&_small]:leading-[1.55] print:shadow-none print:break-inside-avoid"
          aria-label="Other lab values entered"
        >
          <span
            className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
            data-ui="eyebrow"
          >
            OTHER TEST RESULTS YOU ENTERED Â· SHOWN AS SUPPLIED
          </span>
          <div className="flex flex-wrap mx-0 my-3 gap-[9px] [&_span]:bg-paper [&_span]:rounded-[10px] [&_span]:text-[12px] [&_span]:px-[13px] [&_span]:py-2.5 [&_span]:border [&_span]:border-solid [&_span]:border-line">
            {i.hemoglobin !== undefined ? (
              <span>Hemoglobin: {number(i.hemoglobin)} g/dL</span>
            ) : null}
            {i.cholesterol ? (
              <span>
                Cholesterol: {number(i.cholesterol.value)} {i.cholesterol.unit}
              </span>
            ) : null}
          </div>
          <small>
            These results are not interpreted here. A clinician can help explain
            them.
          </small>
        </section>
      ) : null}

      <section
        className="border-b border-line py-8"
        aria-labelledby="actions-heading"
      >
        <div className="mb-6 flex items-end justify-between gap-4 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.035em]">
          <div>
            <span
              className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
              data-ui="eyebrow"
            >
              SMALL STEPS, YOUR PACE
            </span>
            <h2 id="actions-heading">A few ideas for the next 7 days</h2>
          </div>
          <span className="text-[13px] text-soft tracking-[0.09em] max-[561px]:text-[11px]">
            02 / 03
          </span>
        </div>
        {report.actions.length ? (
          <ol className="list-none grid m-0 p-0 gap-0 [&_li]:grid [&_li]:grid-cols-[44px_minmax(0,_1fr)_22px] [&_li]:items-center [&_li]:border-t [&_li]:[border-top-style:solid] [&_li]:[border-top-color:var(--line)] [&_li]:text-[13px] [&_li]:leading-[1.55] [&_li]:px-1 [&_li]:py-[17px] [&_li]:gap-3.5 [&_li:last-child]:border-b [&_li:last-child]:[border-bottom-style:solid] [&_li:last-child]:[border-bottom-color:var(--line)] [&_li>svg]:text-[#78a28a] [&_li>svg]:w-[21px] [&_li>svg]:h-[21px]">
            {report.actions.slice(0, 5).map((action, index) => (
              <li key={`${index}-${action}`}>
                <span className="w-9 h-9 rounded-full grid place-items-center bg-teal-tint text-teal text-[12px] font-bold dark:bg-[#203a30]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{action}</span>
                <Check size={18} aria-hidden="true" />
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-[12px] bg-teal-tint text-ink text-[13px] leading-[1.6] px-[17px] py-[15px]">
            {safety.crisisBloodPressure || safety.glucoseConcern
              ? "No routine wellness suggestions are shown while a potentially unsafe reading needs follow-up. Follow the safety guidance above."
              : safety.disorderedEatingConcern
                ? "No food, diet, or weight-focused actions are shown. You deserve support without numbers or pressure."
                : "No general wellness suggestions are included for this check-in."}
          </p>
        )}
        <p className="text-[12px] text-muted leading-[1.55] mt-3 mb-0 mx-0">
          No medication, supplement, extreme-diet, or calorie-target advice is
          included.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section
          className="border-b border-line py-8"
          aria-labelledby="tired-heading"
        >
          <div className="mb-6 flex items-end justify-between gap-4 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.035em]">
            <div>
              <span
                className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
                data-ui="eyebrow"
              >
                BASED ON YOUR INPUTS
              </span>
              <h2 id="tired-heading">Topics to discuss about tiredness</h2>
            </div>
          </div>
          <ul className="list-none grid m-0 p-0 gap-4 [&_li]:flex [&_li]:items-start [&_li]:text-[13px] [&_li]:leading-[1.6] [&_li]:text-muted [&_li]:gap-3">
            {report.fatigueReasons.slice(0, 5).map((reason) => (
              <li key={reason}>
                <span className="w-[9px] h-[9px] rounded-full bg-[#72a18a] flex-none mt-2 mr-0 mb-0 ml-px" />
                {reason}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-muted leading-[1.55] mt-3 mb-0 mx-0">
            These are discussion topics, not established causes or a complete
            assessment.
          </p>
        </section>
        <section
          className="border-b border-line py-8"
          aria-labelledby="doctor-heading"
        >
          <div className="mb-6 flex items-end justify-between gap-4 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.035em]">
            <div>
              <span
                className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
                data-ui="eyebrow"
              >
                IF YOU CHOOSE TO ASK
              </span>
              <h2 id="doctor-heading">Questions for your doctor</h2>
            </div>
          </div>
          <ol className="list-none grid m-0 p-0 gap-[15px] [&_li]:grid [&_li]:grid-cols-[28px_1fr] [&_li]:text-muted [&_li]:text-[13px] [&_li]:leading-[1.6] [&_li]:gap-2.5 [&_li_span]:text-teal [&_li_span]:text-[13px] [&_li_span]:font-semibold">
            {report.doctorQuestions.slice(0, 5).map((question, index) => (
              <li key={question}>
                <span>{index + 1}</span>
                {question}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {report.context.missingInputs.length > 0 ? (
        <section className="mt-6 rounded-xl bg-panel p-5 text-[13px] leading-relaxed text-muted">
          <strong className="text-ink">Optional details not entered</strong>
          <p className="mt-2 mb-0">
            {report.context.missingInputs.join(", ")}. Missing details limit
            context; entering them would not establish medical accuracy or
            diagnostic confidence.
          </p>
        </section>
      ) : null}

      <details className="mt-4.5 mb-[3px] rounded-[15px] bg-panel overflow-hidden mx-0 border border-solid border-line [&_summary]:min-h-19.5 [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between [&_summary]:list-none [&_summary]:cursor-pointer [&_summary]:px-5 [&_summary]:py-4 [&_summary]:gap-[15px] [&_summary::-webkit-details-marker]:hidden [&_summary_span]:grid [&_summary_span]:gap-1 [&_summary_strong]:text-[14px] [&_summary_small]:text-muted [&_summary_small]:text-[12px] [&_summary_small]:leading-[1.5] [&[open]_summary]:border-b [&[open]_summary]:[border-bottom-style:solid] [&[open]_summary]:[border-bottom-color:var(--line)] [&[open]_summary_svg]:[transform:rotate(180deg)] [&_summary_svg]:flex-none [&_summary_svg]:[transition:transform_0.18s_ease] max-[561px]:[&_summary]:p-[15px] print:break-inside-avoid print:[&>[data-ui~=references-body]]:block!">
        <summary>
          <span>
            <strong>How this works &amp; sources</strong>
            <small>
              Fixed rules explain the check-in; optional AI chat is separate. No
              diagnosis or health score.
            </small>
          </span>
          <ChevronDown size={21} aria-hidden="true" />
        </summary>
        <div
          className="[&_a]:text-teal-strong [&_a]:font-bold [&_a]:underline-offset-[3px] [&_a]:inline-block [&_a]:leading-[1.5] [&_a]:px-0 [&_a]:py-[5px] pt-5 pb-5.5 text-muted text-[13px] leading-[1.6] px-5.5 [&_p]:mt-0 [&_p]:mb-3.5 [&_p]:mx-0 [&_ul]:grid [&_ul]:pl-5 [&_ul]:m-0 [&_ul]:gap-1.5 [&_li]:px-0 [&_li]:py-1 max-[561px]:text-[12px] max-[561px]:p-[17px]"
          data-ui="references-body"
        >
          <p>
            The report above uses fixed, transparent rules to describe some
            common screening ranges. Optional AI chat is separate and is used
            only when you choose to send a message. Blood-sugar ranges apply
            only to eligible laboratory tests and are not a diagnosis. Your
            clinicianâ€™s personal targets may be different. Opening a source
            sends no check-in values; it opens the public information page.
          </p>
          <ul>
            {[...CLINICAL_SOURCES, ...BLOOD_TYPE_SOURCES].map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${source.name} (opens in a new tab)`}
                >
                  {source.name} <span aria-hidden="true">â†—</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#cfe1d6] bg-teal-tint/70 p-5 sm:p-7 print:hidden">
        <div className="flex max-w-[650px] items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal text-white">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <div>
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.13em] text-teal">
              OPTIONAL · ASK A FOLLOW-UP
            </span>
            <h2 className="m-0 font-display text-[25px] font-normal leading-tight tracking-[-0.025em] text-ink">
              Want to talk through your results?
            </h2>
            <p className="mb-0 mt-2 text-[12px] leading-relaxed text-muted">
              Ask an AI wellness guide about your report, everyday habits, or
              questions for your doctor. Your check-in and chat are sent to
              Google Gemini only when you send a message; HealthTracker does not
              save them.
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-teal bg-teal px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-teal-strong"
          data-ui="button button-primary"
          type="button"
          onClick={onOpenChat}
        >
          <Sparkles size={17} aria-hidden="true" /> Talk with the AI guide
        </button>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-line bg-panel p-6 print:hidden">
        <div className="[&_p]:text-muted [&_p]:text-[13px] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:max-w-70 [&_p]:leading-[1.55] [&_p]:mx-0">
          <span
            className="mb-1 block text-[9px] font-semibold uppercase leading-relaxed tracking-[0.13em] text-teal"
            data-ui="eyebrow"
          >
            KEEP A COPY ON YOUR DEVICE
          </span>
          <p>
            HealthTracker does not save this check-in or any AI chat. Choose
            PDF, print, or copy to keep a local copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:[&_button]:w-full">
          <button
            className="border-line bg-panel text-teal hover:border-teal inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 disabled:translate-y-0 print:hidden"
            data-ui="button"
            type="button"
            onClick={copySummary}
          >
            <Clipboard size={19} />
            Copy summary
          </button>
          <button
            className="border-line bg-panel text-teal hover:border-teal inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 disabled:translate-y-0 print:hidden"
            data-ui="button"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={19} />
            Print / Save as PDF
          </button>
          <button
            className="border-teal bg-teal text-white hover:bg-teal-strong dark:bg-teal-strong inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 disabled:translate-y-0 print:hidden"
            data-ui="button button-primary"
            type="button"
            onClick={downloadPDF}
            disabled={pdfBusy}
            aria-busy={pdfBusy}
          >
            {pdfBusy ? (
              <span
                className="w-5 h-5 [border-top-color:white] [border-right-color:rgba(255,_255,_255,_0.35)] [border-bottom-color:rgba(255,_255,_255,_0.35)] [border-left-color:rgba(255,_255,_255,_0.35)] rounded-full animate-[spin_0.7s_linear_infinite] border-2 border-solid"
                aria-hidden="true"
              />
            ) : (
              <Download size={19} />
            )}
            {pdfBusy ? "Preparing PDFâ€¦" : "Download report (PDF)"}
          </button>
        </div>
      </div>
      <p
        className="min-h-[27px] text-teal text-[13px] leading-[1.5] mx-1 my-2 print:hidden!"
        role="status"
        aria-live="polite"
      >
        {pdfNotice || copyNotice}
      </p>

      <footer className="mt-5 flex flex-wrap items-start justify-between gap-6 rounded-xl bg-teal-tint/70 p-6 [&>p]:m-0 [&>p]:max-w-[650px] [&>p]:text-[12px] [&>p]:leading-[1.8] [&>p]:text-muted [&>div]:flex [&>div]:flex-wrap [&>div]:items-center [&>div]:gap-3 print:block print:break-inside-avoid">
        <p>{DISCLAIMER}</p>
        <div>
          <StatusMark label={report.status} />
          <button
            className="border-line bg-panel text-teal hover:border-teal inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 disabled:translate-y-0 print:hidden"
            data-ui="button button-quiet"
            type="button"
            onClick={onStartOver}
          >
            <ArrowLeft size={18} />
            Start over
          </button>
        </div>
      </footer>
    </main>
  );
}
