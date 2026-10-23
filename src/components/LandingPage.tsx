"use client";
import { SiteFooter } from "./SiteFooter";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  CirclePlay,
  FileText,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { PrivacyDialog } from "./PrivacyDialog";

export function LandingPage() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <div className="overflow-x-clip bg-paper">
      <SiteHeader />
      <main id="main">
        <section
          className="relative mx-auto grid max-w-[1240px] items-center gap-4 px-6 pt-14 pb-12 sm:px-10 md:min-h-[650px] md:grid-cols-[1fr_1fr] md:gap-0 md:pt-10 md:pb-8 lg:px-12"
          aria-labelledby="landing-heading"
        >
          <div className="relative z-10 md:pb-24">
            <span className="mb-6 inline-flex rounded-full bg-teal-tint px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-teal">
              PERSONAL WELLNESS INSIGHTS
            </span>
            <h1
              id="landing-heading"
              className="mb-6 max-w-[550px] font-display text-[clamp(48px,6vw,76px)] font-normal leading-[1.03] tracking-[-0.045em] text-ink"
            >
              Know Your
              <br />
              Health.{" "}
              <em className="font-normal text-teal">
                Before
                <br />
                It’s a Problem.
              </em>
            </h1>
            <p className="mb-8 max-w-[400px] text-[15px] leading-[1.85] text-muted">
              A little understanding goes a long way. Bring your health readings
              together for a clearer, more personal view of your wellbeing.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/check-in"
                className="group inline-flex min-h-[48px] items-center justify-center gap-4 rounded-full bg-teal px-6 text-[13px] font-medium text-white shadow-[0_5px_15px_rgba(12,75,71,0.08)] transition-all hover:-translate-y-0.5 hover:bg-teal-strong dark:bg-teal-strong"
              >
                Start Your Check-in{" "}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-11 items-center gap-2.5 text-[12px] font-medium text-ink transition-colors hover:text-teal"
              >
                <CirclePlay size={22} strokeWidth={1.3} />
                How it works
              </a>
            </div>
          </div>
          <div
            className="relative mx-auto h-[490px] w-full max-w-[530px] md:h-[590px]"
            aria-label="Wellness lifestyle photography"
          >
            <div className="absolute right-[6%] bottom-[2%] h-[92%] w-[82%] -rotate-[18deg] rounded-[50%] bg-[#e7eeea] dark:bg-[#233931]" />
            <span
              className="absolute top-[43%] left-[2%] size-8 rounded-full bg-[#d9e9df]/70"
              aria-hidden="true"
            />
            <span
              className="absolute right-[1%] bottom-[9%] size-14 rounded-full border border-[#d0e2d7]/80"
              aria-hidden="true"
            />
            <img
              src="/images/wellness-portrait.webp"
              alt="A young man in a forest-green shirt looking thoughtfully toward the sunlight"
              width={1024}
              height={1536}
              className="absolute inset-0 h-full w-full rounded-b-[48%] object-contain object-bottom"
              fetchPriority="high"
            />
            <div
              className="absolute top-[13%] right-[1%] w-[150px] rounded-2xl border border-line bg-panel/95 p-4 shadow-[0_12px_35px_rgba(23,59,47,0.08)] backdrop-blur-sm sm:right-[0%] sm:w-[168px]"
              aria-label="A clearer perspective on your wellbeing"
            >
              <div className="relative mx-auto mb-3 flex size-[108px] items-center justify-center rounded-full border-[5px] border-[#b9dfcb] border-r-teal border-b-teal">
                <div className="text-center">
                  <Heart
                    size={18}
                    strokeWidth={1.5}
                    className="mx-auto mb-1 text-teal"
                  />
                  <span className="block font-display text-[22px] leading-tight text-ink">
                    Your health
                  </span>
                  <span className="text-[9px] text-soft">IN PERSPECTIVE</span>
                </div>
              </div>
              <span className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-teal">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#39ad87] text-white">
                  <Check size={11} />
                </span>
                A little more clarity
              </span>
            </div>
            <div className="absolute right-0 bottom-[20%] flex max-w-[245px] items-start gap-3 rounded-2xl border border-line bg-panel/95 p-4 shadow-[0_12px_35px_rgba(23,59,47,0.07)] backdrop-blur-sm sm:-right-3 sm:max-w-[270px]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f8e6e1] text-[#c37363]">
                <Activity size={17} strokeWidth={1.7} />
              </span>
              <div>
                <p className="mb-1 text-[11px] font-semibold leading-[1.5] text-ink">
                  Small steps. Better understanding.
                </p>
                <p className="mb-0 text-[10px] leading-[1.7] text-muted">
                  Get to know your numbers,
                  <br />
                  at your own pace.
                </p>
              </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-line/60 pt-5 md:absolute md:bottom-12 md:left-10 md:w-[520px] md:border-0 md:pt-0 lg:left-12">
            {[
              { icon: Timer, title: "Fast & Easy", text: "Just a few minutes" },
              {
                icon: Sparkles,
                title: "Clear by Design",
                text: "Understand your numbers",
              },
              {
                icon: ShieldCheck,
                title: "Private & Secure",
                text: "Your answers stay yours",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2.5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-teal-tint text-teal">
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold text-ink">
                    {title}
                  </p>
                  <p className="mb-0 text-[9px] leading-[1.6] text-muted">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-10 bg-panel px-6 py-16 sm:px-10 md:py-20 lg:px-12"
        >
          <div className="mx-auto grid max-w-[1144px] gap-12 md:grid-cols-[0.9fr_1.3fr] md:gap-16 lg:gap-20">
            <div>
              <span className="mb-4 block text-[10px] font-semibold tracking-[0.15em] text-teal">
                WHY HEALTH TRACKER
              </span>
              <h2 className="mb-6 font-display text-[42px] font-normal leading-[1.08] tracking-[-0.04em] text-ink">
                Simple Check-in.
                <br />
                Powerful Insights.
              </h2>
              <p className="mb-6 max-w-[360px] text-[13px] leading-[1.85] text-muted">
                Get a clearer picture of your health in just a few minutes. Your
                readings, everyday habits, and personal context—all brought
                together in one thoughtful check-in.
              </p>
              <Link
                href="/check-in"
                className="inline-flex min-h-10 items-center gap-3 text-[12px] font-medium text-teal underline decoration-teal/40 underline-offset-4 transition-colors hover:text-ink"
              >
                Take a closer look <ArrowRight size={15} />
              </Link>
            </div>
            <div
              id="insights"
              className="grid scroll-mt-20 grid-cols-1 gap-x-9 gap-y-9 sm:grid-cols-2 md:gap-y-12"
            >
              {[
                {
                  icon: BrainCircuit,
                  title: "Understand your numbers",
                  text: "Clear, plain-language context for your readings and everyday wellbeing.",
                },
                {
                  icon: FileText,
                  title: "Personalized reports",
                  text: "Keep a useful summary, with explanations and questions for your doctor.",
                },
                {
                  icon: TrendingUp,
                  title: "See the bigger picture",
                  text: "Bring sleep, movement, and your personal context into the conversation.",
                },
                {
                  icon: Bell,
                  title: "Know your next step",
                  text: "Understand what may deserve attention and when to seek medical advice.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-teal-tint text-teal">
                    <Icon size={23} strokeWidth={1.55} />
                  </span>
                  <div className="pt-1">
                    <h3 className="mb-2.5 text-[14px] font-medium tracking-[-0.02em] text-ink">
                      {title}
                    </h3>
                    <p className="mb-0 text-[12px] leading-[1.85] text-muted">
                      {text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-panel px-6 pb-8 sm:px-10 lg:px-12">
          <div className="relative mx-auto min-h-[350px] max-w-[1144px] overflow-hidden rounded-2xl bg-[#113937]">
            <img
              src="/images/wellness-banner.webp"
              alt="A quiet morning overlooking green mountain valleys"
              width={2048}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#071f22]/95 via-[#071f22]/45 to-[#071f22]/35" />
            <div className="relative grid items-center gap-10 px-7 py-12 text-white sm:px-10 md:grid-cols-[1.6fr_1fr] md:px-12">
              <div>
                <span className="mb-4 block text-[10px] font-medium tracking-[0.16em] text-[#b2dac8]">
                  YOUR HEALTH MATTERS
                </span>
                <h2 className="mb-4 font-display text-[38px] font-normal leading-[1.06] tracking-[-0.04em] sm:text-[44px]">
                  Small Steps Today.
                  <br />A Healthier Tomorrow.
                </h2>
                <p className="mb-6 max-w-[335px] text-[13px] leading-[1.8] text-[#e2eae4]">
                  Know your numbers, understand your context,
                  <br className="hidden sm:block" /> and make space for a little
                  more wellbeing.
                </p>
                <Link
                  href="/check-in"
                  className="group inline-flex min-h-11 items-center gap-4 rounded-full bg-white px-6 text-[12px] font-medium text-[#123b36] transition-all hover:-translate-y-0.5 hover:bg-[#e6f3eb]"
                >
                  Get Started Free{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
              <div className="space-y-5 md:justify-self-end md:pt-12">
                {[
                  { icon: Sparkles, text: "A clearer perspective" },
                  { icon: Heart, text: "Small, meaningful steps" },
                  { icon: Leaf, text: "Everyday wellbeing" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3.5">
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <span className="text-[12px] font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter onPrivacy={() => setPrivacyOpen(true)} />
      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
