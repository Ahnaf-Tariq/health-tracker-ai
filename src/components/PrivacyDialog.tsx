import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DISCLAIMER } from "../domain/constants";

export function PrivacyDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="m-auto w-[min(100%_-_28px,_500px)] rounded-[18px] bg-panel text-ink shadow-[0_24px_80px_rgba(10,_35,_26,_0.25)] max-h-[min(92vh,_720px)] p-0 border border-solid border-line backdrop:bg-[rgba(23,_44,_38,_0.45)] backdrop:[backdrop-filter:blur(3px)]"
      aria-labelledby="privacy-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="p-6 sm:p-8 [&_h2]:my-4 [&_h2]:font-display [&_h2]:text-[34px] [&_h2]:font-normal [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&>p]:text-[13px] [&>p]:leading-[1.85] [&>p]:text-muted">
        <button
          className="float-right inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-teal-tint text-teal transition-colors hover:bg-line"
          type="button"
          onClick={onClose}
          aria-label="Close privacy and disclaimer"
        >
          <X size={19} />
        </button>
        <span
          className="block text-[9px] font-semibold tracking-[0.12em] text-teal"
          data-ui="eyebrow"
        >
          YOUR DATA, YOUR DEVICE
        </span>
        <h2 id="privacy-title">A private check-in, by design</h2>
        <p>
          Your report is calculated in this browser. If you choose the AI chat
          and send a message, your report context and chat messages are sent to
          Google Gemini so it can reply. Your private safety note is excluded.
          HealthTracker does not save conversations or health data.
        </p>
        <p>
          There is no account, database, analytics, or advertising tracker. The
          chat is not stored by HealthTracker and clears from this page when you
          leave. Google handles API data under its own terms and privacy policy.
        </p>
        <div className="my-5 rounded-xl bg-paper p-5 [&_strong]:text-[12px] [&_strong]:text-teal [&_p]:mt-2 [&_p]:mb-0 [&_p]:text-[12px] [&_p]:leading-[1.85] dark:bg-[#202d27]">
          <strong>Important note</strong>
          <p>{DISCLAIMER}</p>
        </div>
        <button
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-teal px-5 py-3 text-[13px] font-medium text-white transition-colors hover:bg-teal-strong dark:bg-teal-strong"
          data-ui="button button-primary"
          type="button"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}
