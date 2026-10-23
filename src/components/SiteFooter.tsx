"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { PrivacyDialog } from "./PrivacyDialog";

export function SiteFooter({
  compact = false,
  onPrivacy,
}: {
  compact?: boolean;
  onPrivacy?: () => void;
}) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => (onPrivacy ? onPrivacy() : setPrivacyOpen(true));

  return (
    <>
      <footer className="relative mt-auto overflow-hidden bg-[#082f2d] px-6 text-[#e6f0eb] print:hidden sm:px-10 lg:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 -right-28 size-[500px] rounded-full border border-[#b9dec7]/[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-12 size-[370px] rounded-full border border-[#b9dec7]/[0.07]"
        />
        <div className="relative mx-auto max-w-[1144px]">
          {!compact && (
            <div className="flex flex-wrap items-center justify-between gap-7 border-b border-white/10 py-12 sm:py-14">
              <div>
                <span className="mb-4 block text-[9px] font-medium tracking-[0.18em] text-[#a5cdbb]">
                  A SMALL STEP. A CLEARER PERSPECTIVE.
                </span>
                <h2 className="m-0 font-display text-[clamp(34px,4vw,48px)] font-normal leading-[1.12] tracking-[-0.025em]">
                  Make room for{" "}
                  <em className="text-[#b5d9c5]">your wellbeing.</em>
                </h2>
              </div>
              <Link
                href="/check-in"
                className="group inline-flex min-h-12 shrink-0 items-center gap-6 rounded-full bg-[#e5f2e9] py-3 pr-4 pl-6 text-[12px] font-semibold text-[#0b403c] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Start your check-in{" "}
                <span className="flex size-7 items-center justify-center rounded-full bg-[#0b403c]/10">
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </div>
          )}
          <div
            className={`grid gap-9 ${compact ? "py-9 md:grid-cols-[1.5fr_1fr_1fr]" : "py-11 md:grid-cols-[1.5fr_0.7fr_1fr] md:gap-16"}`}
          >
            <div>
              <Link
                href="/"
                aria-label="HealthTracker home"
                className="mb-4 inline-flex items-center gap-2.5 text-[#f1f7f2]"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#b5d9c5]/10 text-[#b5d9c5]">
                  <Activity size={27} strokeWidth={1.5} />
                </span>
                <span className="text-[17px] font-bold tracking-[-0.04em]">
                  HealthTracker
                </span>
              </Link>
              <p className="mb-0 max-w-[300px] text-[12px] leading-[1.9] text-[#b5cbc3]">
                A thoughtful place to understand your numbers, find your
                context, and take your next small step.
              </p>
            </div>
            <nav aria-label="Footer navigation">
              <h3 className="mb-4 text-[10px] font-semibold tracking-[0.12em] text-[#91b8a6]">
                EXPLORE
              </h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[12px] md:grid-cols-1 [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center [&_a]:gap-2 [&_a]:transition-colors [&_a:hover]:text-[#a2dcbf]">
                <Link href="/">Home</Link>
                <Link href="/about">About us</Link>
                <a href="/#how-it-works">How it works</a>
                <a href="/#insights">
                  Our approach{" "}
                  <ArrowUpRight size={12} className="text-[#91b8a6]" />
                </a>
              </div>
            </nav>
            <div>
              <h3 className="mb-4 text-[10px] font-semibold tracking-[0.12em] text-[#91b8a6]">
                PERSONAL. PRIVATE. YOURS.
              </h3>
              <p className="mb-3 text-[12px] leading-[1.9] text-[#b5cbc3]">
                No account or health-data storage by HealthTracker.
                <br />
                Optional chat sends context to Google Gemini.
              </p>
              <button
                type="button"
                onClick={openPrivacy}
                className="group inline-flex min-h-10 cursor-pointer items-center gap-2 text-[12px] font-medium text-[#d9ece0] underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
              >
                Privacy & disclaimer{" "}
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2.5 border-t border-white/10 pt-5 text-[10px] leading-[1.8] text-[#9db8ae]">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#a5cdbb]" />
            <p className="mb-0 max-w-[850px]">
              General wellness information for adults, not medical advice,
              diagnosis, or treatment. Never a substitute for professional care.
              If you think you have an emergency, call your local emergency
              number.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 pb-7 text-[10px] text-[#9db8ae]">
            <span>© 2026 HealthTracker. Your wellbeing, made clearer.</span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-1.5 rounded-full bg-[#9dd2b5]"
                aria-hidden="true"
              />
              <LockKeyhole size={12} /> Designed around your privacy
            </span>
          </div>
        </div>
      </footer>
      {!onPrivacy && (
        <PrivacyDialog
          open={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
        />
      )}
    </>
  );
}
