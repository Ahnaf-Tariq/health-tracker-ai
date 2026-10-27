import type { WellnessReport } from "./types";
import type { ChatContext } from "../lib/chatStore";

export function createSafeChatContext(report: WellnessReport): ChatContext {
  const { notes: _privateSafetyNote, ...answers } = report.inputs;
  const safeReport = {
    ...report,
    inputs: answers,
    safety: { ...report.safety, selfHarmConcern: false },
  };
  return clean({ answers, report: safeReport }) as ChatContext;
}

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => item === undefined ? null : clean(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, clean(item)]));
  }
  return value;
}
