import { Check } from "lucide-react";

export function CheckInProgress({ complete = false }: { complete?: boolean }) {
  const steps = ["Your Details", "Health Metrics", "Your Insights"];
  return (
    <ol
      aria-label="Check-in overview"
      className="mb-9 flex list-none items-center justify-between gap-2 border-b border-line pb-7 text-[11px] sm:gap-4 sm:text-xs"
    >
      {steps.map((label, index) => (
        <li
          key={label}
          className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 ${complete || index === 0 ? "text-teal" : "text-soft"}`}
          aria-current={
            (complete ? index === 2 : index === 0) ? "step" : undefined
          }
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] ${complete || index === 0 ? "bg-teal text-white" : "bg-paper text-muted"}`}
          >
            {complete && index < 2 ? (
              <Check size={12} aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>
          <span className="font-medium leading-tight">{label}</span>
          {index < 2 ? (
            <span
              className="ml-1 hidden h-px flex-1 bg-line sm:block"
              aria-hidden="true"
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
