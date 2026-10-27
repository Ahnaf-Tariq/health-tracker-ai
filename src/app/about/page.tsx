import { SiteFooter } from "../../components/SiteFooter";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  HeartHandshake,
  ScanLine,
} from "lucide-react";
import { SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "About us — HealthTracker",
  description:
    "The idea behind HealthTracker: a more thoughtful, private way to understand your everyday wellbeing.",
};

export default async function AboutPage() {
  await connection();
  return (
    <div className="overflow-x-clip bg-paper">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-16 sm:px-10 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-24 lg:px-12">
          <div>
            <span className="mb-7 inline-flex rounded-full bg-teal-tint px-4 py-1.5 text-[10px] font-semibold tracking-[0.13em] text-teal">
              THE PEOPLE BEHIND THE PURPOSE
            </span>
            <h1 className="mb-7 font-display text-[clamp(52px,6.5vw,84px)] leading-[1.03] tracking-[-0.045em]">
              Less noise.
              <br />
              More clarity.
              <br />
              <em className="text-teal">A little more you.</em>
            </h1>
            <p className="max-w-[410px] text-[15px] leading-[1.9] text-muted">
              We believe understanding your health should feel a little less
              overwhelming. HealthTracker is our way of making space for a
              calmer, more thoughtful check-in.
            </p>
            <a
              href="#our-story"
              className="mt-5 inline-flex min-h-11 items-center gap-4 text-[12px] font-medium text-teal underline decoration-teal/30 underline-offset-4"
            >
              Get to know our purpose <ArrowRight size={16} />
            </a>
          </div>
          <div className="relative pb-12 pl-5 sm:pl-9">
            <img
              src="/images/check-in-scene.webp"
              alt="Sunlight falling across a quiet green space"
              width={1774}
              height={887}
              className="h-[390px] w-full rounded-t-[140px] rounded-b-xl object-cover object-[65%_center] sm:h-[465px]"
              fetchPriority="high"
            />
            <div className="absolute bottom-0 left-0 max-w-[285px] rounded-xl bg-[#0b403c] p-7 text-white shadow-panel">
              <span className="text-[9px] tracking-[0.15em] text-[#b2dac8]">
                OUR GUIDING THOUGHT
              </span>
              <p className="mt-4 mb-0 font-display text-[31px] leading-[1.15] tracking-[-0.02em]">
                Health is personal.
                <br />
                Understanding it
                <br />
                <em>should be, too.</em>
              </p>
            </div>
          </div>
        </section>

        <section
          id="our-story"
          className="border-y border-line bg-panel px-6 py-16 sm:px-10 md:py-20 lg:px-12"
        >
          <div className="mx-auto grid max-w-[1144px] gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-teal">
                01 / OUR STORY
              </span>
              <h2 className="mt-5 font-display text-[42px] leading-[1.1] tracking-[-0.035em]">
                A quiet project.
                <br />
                <em>A clear purpose.</em>
              </h2>
            </div>
            <div className="space-y-5 text-[15px] leading-[1.95] text-muted">
              <p className="mb-0">
                Health information can be a lot to take in. A reading here, a
                restless night there, a question you keep meaning to ask. We
                wanted a simple place to bring those pieces together—with
                context, care, and room to breathe.
              </p>
              <p className="mb-0">
                We keep the people behind HealthTracker anonymous. This space is
                about your wellbeing, rather than our names or faces. What we do
                want you to know is the thinking behind it: clear explanations,
                honest limits, and respect for your privacy.
              </p>
              <p className="mb-0 text-ink">
                A small step toward understanding yourself. At your own pace.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10 md:py-20 lg:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-teal">
                02 / WHAT WE STAND FOR
              </span>
              <h2 className="mt-5 font-display text-[42px] leading-[1.1] tracking-[-0.035em]">
                Thoughtful by design.
              </h2>
            </div>
            <p className="mb-0 max-w-[280px] text-[13px] leading-relaxed text-muted">
              The little decisions that shape every part of your check-in.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                icon: Fingerprint,
                number: "01",
                title: "Your privacy comes first.",
                text: "Check-ins work without an account. After sign-in, Firebase stores your profile and chat history. Report snapshots are saved only with report-based chats; messages and attached context are sent to Google Gemini when you chat.",
              },
              {
                icon: ScanLine,
                number: "02",
                title: "Clarity over complexity.",
                text: "The report uses plain-language explanations and transparent rules. A separate, optional AI guide can explain your results and help prepare questions, without diagnosing or prescribing.",
              },
              {
                icon: HeartHandshake,
                number: "03",
                title: "Care without judgment.",
                text: "Share what you know. Skip the optional details. Find context for your readings and thoughtful questions to take to a healthcare professional.",
              },
            ].map(({ icon: Icon, number, title, text }) => (
              <article key={number} className="border-t border-line pt-6">
                <div className="mb-8 flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-teal-tint text-teal">
                    <Icon size={23} strokeWidth={1.4} />
                  </span>
                  <span className="font-display text-[25px] text-muted/60">
                    {number}
                  </span>
                </div>
                <h3 className="mb-3 font-display text-[29px] leading-tight tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="mb-0 text-[13px] leading-[1.9] text-muted">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 py-14 sm:px-10 lg:px-12">
          <div className="relative mx-auto max-w-[1144px] overflow-hidden rounded-2xl bg-[#0b403c] px-7 py-12 text-white sm:px-12 md:py-16">
            <img
              src="/images/wellness-banner.webp"
              alt=""
              width={1942}
              height={809}
              className="absolute inset-0 h-full w-full object-cover object-right opacity-25"
              loading="lazy"
            />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr] md:gap-16">
              <div>
                <span className="text-[10px] tracking-[0.13em] text-[#b2dac8]">
                  A MOMENT FOR YOURSELF
                </span>
                <h2 className="mt-5 mb-5 font-display text-[clamp(38px,4vw,52px)] leading-[1.08] tracking-[-0.035em]">
                  Your next small step
                  <br />
                  <em>starts with you.</em>
                </h2>
                <Link
                  href="/check-in"
                  className="inline-flex min-h-12 items-center gap-5 rounded-full bg-white px-6 text-[13px] font-medium text-[#0b403c] transition-colors hover:bg-[#e7f3ed]"
                >
                  Start your check-in <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="border-t border-white/20 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-9">
                <h3 className="mb-4 font-display text-[27px]">
                  A companion to your care.
                </h3>
                <p className="mb-0 text-[13px] leading-[1.9] text-[#d5e7df]">
                  HealthTracker offers general wellness information for adults.
                  It is not a diagnosis, medical advice, or a substitute for a
                  healthcare professional. If you think you have an emergency,
                  call your local emergency number.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
