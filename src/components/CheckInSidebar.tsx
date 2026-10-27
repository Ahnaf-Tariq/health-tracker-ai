import {
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export function CheckInSidebar({ onPrivacy }: { onPrivacy?: () => void }) {
  return (
    <aside
      className="min-w-0 space-y-8 lg:sticky lg:top-8 lg:self-start print:hidden"
      aria-label="About your private check-in"
    >
      <div className="overflow-hidden rounded-xl bg-[#f0f3ef] dark:bg-panel">
        <img
          src="/images/care-detail.webp"
          alt="A teal stethoscope resting on soft linen"
          width={600}
          height={450}
          className="h-[180px] w-full object-cover"
          loading="lazy"
        />
        <div className="p-6">
          <h2 className="mb-3 font-display text-[27px] font-normal tracking-[-0.04em]">
            Why it matters.
          </h2>
          <p className="mb-0 text-[13px] leading-[1.8] text-muted">
            Your numbers are a starting point. Understanding them can help you
            ask better questions and make room for healthier everyday habits.
          </p>
        </div>
      </div>
      <div className="space-y-6 px-1">
        {[
          {
            icon: Sparkles,
            title: "A little more clarity",
            text: "Plain-language context for the readings you share.",
          },
          {
            icon: Stethoscope,
            title: "Know what to ask",
            text: "Thoughtful questions to take to your healthcare professional.",
          },
          {
            icon: HeartHandshake,
            title: "Small, useful next steps",
            text: "Gentle suggestions that fit into your everyday life.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-teal-tint text-teal">
              <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <h3 className="mb-1.5 text-[12px] font-semibold text-ink">
                {title}
              </h3>
              <p className="mb-0 text-[12px] leading-[1.8] text-muted">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-xl bg-[#083b37] p-7 text-white">
        <svg
          className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-72 opacity-15"
          viewBox="0 0 280 180"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M-10 155C65 5 115 205 172 92S238 18 295 39M-18 180C47 20 98 224 167 121S236 55 300 75M-25 203C33 60 110 245 176 151S240 88 301 111"
            stroke="#94cfb0"
          />
        </svg>
        <span className="relative mb-5 inline-flex items-center gap-2 rounded-full bg-white/8 py-1.5 pr-3 pl-2 text-[10px] font-medium">
          <ShieldCheck size={16} className="text-[#a8dec8]" />
          Your Health. Your Priority.
        </span>
        <h2 className="relative mb-3 font-display text-[28px] font-normal leading-tight tracking-[-0.03em]">
          Safe. Private. Yours.
        </h2>
        <p className="relative mb-5 text-[12px] leading-[1.85] text-[#d4e5dc]">
          Your report is calculated in this browser. If you choose the AI chat, your report and messages are sent to Google Gemini. Your Firebase account saves report-based chat history.
        </p>
        {onPrivacy ? (
          <button
            type="button"
            onClick={onPrivacy}
            className="relative inline-flex min-h-9 items-center gap-2 text-[11px] font-medium text-[#c0e4d3] underline underline-offset-4"
          >
            <LockKeyhole size={13} />
            Privacy & disclaimer
          </button>
        ) : (
          <span className="relative text-[11px] text-[#c0e4d3]">
            For your eyes only.
          </span>
        )}
      </div>
      <p className="px-1 text-[11px] leading-[1.8] text-soft">
        General wellness information for adults. This check-in is not a
        diagnosis or a substitute for medical care.
      </p>
    </aside>
  );
}
