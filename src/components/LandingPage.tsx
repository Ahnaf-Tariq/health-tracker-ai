"use client";
import { SiteFooter } from "./SiteFooter";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  Check,
  CirclePlay,
  ClipboardList as ClipboardListIcon,
  FileText,
  Heart,
  HeartPulse,
  Leaf,
  MessageCircle as MessageCircleIcon,
  ShieldCheck,
  Sparkles,
  Stethoscope as StethoscopeIcon,
  Timer,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { PrivacyDialog } from "./PrivacyDialog";

export function LandingPage() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
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

        <section className="bg-panel px-6 py-16 sm:px-10 md:py-20 lg:px-12">
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
            <div className="grid grid-cols-1 gap-x-9 gap-y-9 sm:grid-cols-2 md:gap-y-12">
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

        <motion.section
          id="insights"
          className="relative scroll-mt-20 overflow-hidden bg-paper px-6 py-18 sm:px-10 md:py-24 lg:px-12"
          aria-labelledby="whole-picture-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <div
            className="pointer-events-none absolute -right-28 top-10 size-[360px] rounded-full border border-teal/10 sm:size-[480px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1144px] items-center gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <span className="mb-4 block text-[10px] font-semibold tracking-[0.15em] text-teal">
                THE WHOLE PICTURE
              </span>
              <h2
                id="whole-picture-heading"
                className="mb-5 max-w-[490px] font-display text-[clamp(36px,4.5vw,54px)] font-normal leading-[1.08] tracking-[-0.04em] text-ink"
              >
                Your wellbeing is bigger than one number.
              </h2>
              <p className="mb-5 max-w-[440px] text-[13px] leading-[1.9] text-muted">
                A reading is a moment in time. Sleep, symptoms, everyday habits,
                and personal context can all shape the questions worth asking.
              </p>
              <p className="mb-7 max-w-[440px] text-[12px] leading-[1.85] text-muted">
                HealthTracker brings selected details together for a clearer
                conversation. It does not calculate a validated measure of your
                overall health or replace a clinician’s assessment.
              </p>
              <Link
                href="/check-in"
                className="group inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold text-teal underline decoration-teal/35 underline-offset-4 transition-colors hover:text-ink"
              >
                Bring your details into context
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-[560px]">
              <div
                className="absolute -left-5 top-12 size-20 rounded-full bg-teal-tint/80 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative rounded-[26px] border border-line bg-panel p-5 shadow-panel sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-5">
                  <div>
                    <span className="block text-[9px] font-semibold tracking-[0.14em] text-teal">
                      A MORE USEFUL SNAPSHOT
                    </span>
                    <h3 className="mb-0 mt-1 font-display text-[25px] font-normal text-ink">
                      A few signals, in context
                    </h3>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-tint text-teal">
                    <HeartPulse size={21} strokeWidth={1.6} />
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: Activity,
                      label: "Measurements",
                      text: "Readings you already have",
                    },
                    {
                      icon: Timer,
                      label: "Patterns",
                      text: "Sleep and everyday routines",
                    },
                    {
                      icon: Heart,
                      label: "Symptoms",
                      text: "What you’ve noticed lately",
                    },
                    {
                      icon: ShieldCheck,
                      label: "Your context",
                      text: "Details that can change interpretation",
                    },
                  ].map(({ icon: Icon, label, text }, index) => (
                    <motion.article
                      key={label}
                      className="flex min-h-[92px] items-start gap-3 rounded-2xl bg-paper p-4"
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.4,
                        delay: reduceMotion ? 0 : index * 0.07,
                      }}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-tint text-teal">
                        <Icon size={17} strokeWidth={1.6} />
                      </span>
                      <span>
                        <strong className="block text-[11px] font-semibold text-ink">
                          {label}
                        </strong>
                        <span className="mt-1 block text-[10px] leading-relaxed text-muted">
                          {text}
                        </span>
                      </span>
                    </motion.article>
                  ))}
                </div>
                <p className="mb-0 mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-muted">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-teal"
                  />
                  Missing a reading is okay. The report only interprets details
                  you provide.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="how-it-works"
          className="scroll-mt-20 bg-panel px-6 py-18 sm:px-10 md:py-22 lg:px-12"
          aria-labelledby="check-in-steps-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <div className="mx-auto max-w-[1144px]">
            <div className="mb-10 grid gap-5 md:grid-cols-[1fr_0.65fr] md:items-end md:gap-12">
              <div>
                <span className="mb-4 block text-[10px] font-semibold tracking-[0.15em] text-teal">
                  A GENTLE THREE-STEP FLOW
                </span>
                <h2
                  id="check-in-steps-heading"
                  className="mb-0 max-w-[590px] font-display text-[clamp(36px,4.5vw,52px)] font-normal leading-[1.08] tracking-[-0.04em] text-ink"
                >
                  From what you know to what you can ask.
                </h2>
              </div>
              <p className="mb-1 max-w-[390px] text-[12px] leading-[1.85] text-muted">
                No special equipment or perfect routine needed. Share what’s
                available, then take the report at your own pace.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  number: "01",
                  icon: ClipboardListIcon,
                  title: "Share what you know",
                  text: "Enter the basics and any readings or details you want to include. Optional sections can be skipped.",
                },
                {
                  number: "02",
                  icon: FileText,
                  title: "See clear context",
                  text: "Fixed, transparent rules organize selected values into plain-language screening information.",
                },
                {
                  number: "03",
                  icon: StethoscopeIcon,
                  title: "Choose a next step",
                  text: "Review suggested actions and questions you may want to bring to a healthcare professional.",
                },
              ].map(({ number, icon: Icon, title, text }, index) => (
                <motion.article
                  key={number}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-paper p-6 transition-colors hover:border-[#b7d4c5] sm:p-7"
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : index * 0.09,
                  }}
                >
                  <span
                    className="absolute -right-2 -top-7 font-display text-[86px] leading-none text-teal/[0.06] transition-transform duration-500 group-hover:-translate-y-1"
                    aria-hidden="true"
                  >
                    {number}
                  </span>
                  <span className="mb-7 grid size-11 place-items-center rounded-2xl bg-teal-tint text-teal">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <span className="mb-2 block text-[9px] font-bold tracking-[0.14em] text-teal">
                    STEP {number}
                  </span>
                  <h3 className="mb-2 font-display text-[24px] font-normal leading-tight text-ink">
                    {title}
                  </h3>
                  <p className="mb-0 text-[12px] leading-[1.8] text-muted">
                    {text}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="bg-paper px-6 py-18 sm:px-10 md:py-22 lg:px-12"
          aria-labelledby="doctor-conversation-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <div className="mx-auto grid max-w-[1144px] items-center gap-10 rounded-[28px] border border-line bg-panel p-6 shadow-panel sm:p-9 md:grid-cols-[1fr_0.9fr] md:gap-14 md:p-12">
            <div>
              <span className="mb-4 block text-[10px] font-semibold tracking-[0.15em] text-teal">
                A BETTER PREPARED VISIT
              </span>
              <h2
                id="doctor-conversation-heading"
                className="mb-4 max-w-[500px] font-display text-[clamp(35px,4.2vw,50px)] font-normal leading-[1.08] tracking-[-0.04em] text-ink"
              >
                Good questions can make a conversation easier.
              </h2>
              <p className="mb-6 max-w-[470px] text-[12px] leading-[1.85] text-muted">
                Your report includes prompts based on the information you
                entered. If you choose, an AI wellness guide can also help
                explain the report or think through questions to discuss with
                your clinician.
              </p>
              <Link
                href="/check-in"
                className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-teal px-5 text-[12px] font-semibold text-white transition-colors hover:bg-teal-strong"
              >
                Start with a check-in
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <p className="mb-0 mt-4 max-w-[470px] text-[10px] leading-relaxed text-muted">
                The AI guide is optional and educational. It cannot diagnose,
                prescribe, or replace professional care. Chat messages and
                attached report context are sent to Google Gemini when you send
                a message.
              </p>
            </div>
            <div className="relative mx-auto grid w-full max-w-[440px] gap-3 rounded-[24px] bg-teal-tint/70 p-4 sm:p-6">
              <div className="mb-1 flex items-center gap-3 px-1 py-2">
                <span className="grid size-10 place-items-center rounded-xl bg-teal text-white">
                  <MessageCircleIcon size={19} />
                </span>
                <span>
                  <strong className="block text-[12px] font-semibold text-ink">
                    Questions worth bringing
                  </strong>
                  <span className="text-[10px] text-muted">
                    A starting point for your visit
                  </span>
                </span>
              </div>
              {[
                "How should I confirm this measurement?",
                "What should I keep track of before we meet?",
                "Which symptoms mean I should seek care sooner?",
              ].map((question, index) => (
                <motion.div
                  key={question}
                  className="flex items-start gap-3 rounded-2xl border border-line/70 bg-panel px-4 py-3.5 text-[11px] leading-relaxed text-ink shadow-[0_5px_18px_rgba(25,63,51,0.035)]"
                  initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.4,
                    delay: reduceMotion ? 0 : index * 0.08,
                  }}
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-teal-tint text-[9px] font-semibold text-teal">
                    {index + 1}
                  </span>
                  {question}
                </motion.div>
              ))}
              <div className="flex items-center gap-2 px-1 pt-1 text-[9px] leading-relaxed text-muted">
                <ShieldCheck size={13} className="shrink-0 text-teal" />
                If symptoms feel urgent, seek care rather than waiting for a
                chat response.
              </div>
            </div>
          </div>
        </motion.section>

        <section id="about" className="px-6 pb-8 sm:px-10 lg:px-12">
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
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                      <Icon size={15} strokeWidth={1.5} />
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
