import type { ReactNode } from "react";
import { ArrowUpRight, Check, Minus, TriangleAlert } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  category: string;
  note: string;
  tip: string;
  icon: ReactNode;
  tone?: "neutral" | "watch" | "calm";
}

export function MetricCard({
  title,
  value,
  category,
  note,
  tip,
  icon,
  tone = "neutral",
}: MetricCardProps) {
  const StatusIcon =
    tone === "watch" ? TriangleAlert : tone === "calm" ? Check : Minus;
  return (
    <article
      className="min-w-0 rounded-xl border border-line bg-panel p-6 shadow-panel transition-shadow hover:shadow-[0_12px_35px_rgba(25,63,51,0.07)] [&[data-tone=watch]_[data-ui~=metric-status]]:text-amber [&[data-tone=watch]_[data-ui~=metric-category]]:bg-amber-bg [&[data-tone=watch]_[data-ui~=metric-category]]:text-amber print:break-inside-avoid print:shadow-none"
      data-tone={tone}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-xl bg-teal-tint text-teal"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="flex-1 text-[13px] font-medium text-muted">
          {title}
        </span>
        <StatusIcon
          className="size-[18px] text-[#75a184]"
          data-ui="metric-status"
          size={16}
          aria-hidden="true"
        />
      </div>
      <p className="mt-5 mb-3 font-display text-[36px] font-normal leading-tight tracking-[-0.04em] text-ink">
        {value}
      </p>
      <span
        className="inline-block rounded-full bg-teal-tint px-3 py-1.5 text-[11px] font-medium text-teal"
        data-ui="metric-category"
      >
        {category}
      </span>
      <p className="my-4 text-[13px] leading-[1.85] text-muted">{note}</p>
      <p className="m-0 flex items-start gap-2 border-t border-line pt-4 text-[12px] leading-[1.8] text-teal [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
        <ArrowUpRight size={15} aria-hidden="true" />
        {tip}
      </p>
    </article>
  );
}
