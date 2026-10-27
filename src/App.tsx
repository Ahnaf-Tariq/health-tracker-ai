"use client";
import { SiteFooter } from "./components/SiteFooter";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./components/SiteHeader";
import { CheckInForm } from "./components/CheckInForm";
import { PrivacyDialog } from "./components/PrivacyDialog";
import { ResultsView } from "./components/ResultsView";
import type { WellnessReport } from "./domain/types";
import { useCheckInSession } from "./components/AppProviders";

type Screen = "form" | "results" | "support";

export default function App() {
  const { report, setReport } = useCheckInSession();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(() =>
    report ? "results" : "form",
  );
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const transitionDuration = prefersReducedMotion ? 0 : 0.24;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("support") === "1")
      openSupport();
  }, []);

  function startOver() {
    setReport(null);
    setScreen("form");
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }
  function receiveReport(next: WellnessReport) {
    setReport(next);
    setScreen("results");
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }
  function openSupport() {
    setReport(null);
    setScreen("support");
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div id="main">
        <AnimatePresence mode="wait" initial={false}>
          {screen === "form" ? (
            <motion.div
              key="form"
              className="min-h-[50vh]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: transitionDuration, ease: "easeOut" }}
            >
              <CheckInForm
                onReport={receiveReport}
                onSupport={openSupport}
                onPrivacy={() => setPrivacyOpen(true)}
              />
            </motion.div>
          ) : null}
          {screen === "results" && report ? (
            <motion.div
              key="results"
              className="min-h-[50vh]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: transitionDuration, ease: "easeOut" }}
            >
              <ResultsView
                report={report}
                onStartOver={startOver}
                onOpenChat={() => {
                  router.push("/chat/new?source=report");
                }}
              />
            </motion.div>
          ) : null}
          {screen === "support" ? (
            <motion.main
              key="support"
              className="w-[min(100%_-_48px,_1060px)] pt-13.5 pb-15 max-w-190 min-h-[calc(100vh_-_160px)] mx-auto my-0 px-0 [&_h1]:font-normal [&_h1]:text-[clamp(42px,_5.6vw,_64px)] [&_h1]:leading-[1.08] [&_h1]:font-display [&_h1]:tracking-[-0.035em] [&_h1]:max-w-167.5 [&_h1]:mx-0 [&_h1]:my-[15px] [&_[data-ui~=eyebrow]]:text-[#9b473f] [&>p]:text-[17px] [&>p]:leading-[1.7] [&>p]:text-muted [&>p]:max-w-152.5 [&_[data-ui~=button]]:mt-[5px] max-[761px]:w-[min(100%_-_36px,_680px)] max-[761px]:pt-[39px] max-[761px]:pb-12 max-[561px]:w-[calc(100%_-_30px)] max-[561px]:py-12 print:w-full print:max-w-none print:mx-0 print:px-3 print:py-0"
              aria-labelledby="support-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: transitionDuration, ease: "easeOut" }}
            >
              <span className="w-14.5 h-14.5 rounded-[17px] bg-[#fcecea] text-[#a54037] grid place-items-center mb-[23px] dark:bg-[#3c2827] dark:text-[#f3aaa2]">
                <Heart size={28} aria-hidden="true" />
              </span>
              <span
                className="text-[12px] tracking-[0.11em] font-[750] text-teal leading-[1.4] block"
                data-ui="eyebrow"
              >
                YOU MATTER · PLEASE REACH OUT
              </span>
              <h1 id="support-title">You deserve support right now.</h1>
              <p>
                If you may hurt yourself, want to die, or feel unsafe, please
                contact your local emergency number or crisis service now. If
                you can, tell someone you trust and ask them to stay with you
                while you get help.
              </p>
              <p>
                You don’t have to go through this moment alone. HealthTracker
                has paused this check-in or chat. The private note or message
                that triggered this screen was not sent to Google Gemini or
                included in a report.
              </p>
              <div className="flex items-start rounded-[10px] bg-teal-tint text-muted text-[15px] leading-[1.6] mx-0 my-5.5 px-4.5 py-[17px] gap-3 [&_svg]:text-teal [&_svg]:flex-none">
                <ShieldCheck size={20} />
                <span>
                  If there is immediate danger, go to the nearest emergency
                  department or call your local emergency number.
                </span>
              </div>
              <button
                className="bg-panel text-teal-strong min-h-12.5 rounded-[13px] inline-flex items-center justify-center text-[16px] font-[650] no-underline cursor-pointer [transition:transform_0.15s,_border-color_0.15s,_background_0.15s,_box-shadow_0.15s] px-[17px] py-3 border border-solid border-[#d5e1db] gap-2.5 [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:hover:not(:disabled)]:shadow-[0_4px_12px_rgba(22,_81,_69,_0.08)] [&:hover:not(:disabled)]:border-[#92bba9] print:hidden!"
                data-ui="button"
                type="button"
                onClick={startOver}
              >
                <ArrowLeft size={18} />
                Return to the check-in
              </button>
            </motion.main>
          ) : null}
        </AnimatePresence>
      </div>

      {screen !== "results" || !report?.safety.urgent ? (
        <SiteFooter compact onPrivacy={() => setPrivacyOpen(true)} />
      ) : null}
      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
