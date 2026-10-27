"use client";

import { useEffect, type ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  icon: ReactNode;
  children?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  confirmVariant?: "danger" | "primary";
  busy?: boolean;
  busyLabel?: string;
  errorMessage?: string;
  confirmDisabled?: boolean;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  icon,
  children,
  onConfirm,
  onClose,
  confirmVariant = "danger",
  busy = false,
  busyLabel = "Working…",
  errorMessage = "",
  confirmDisabled = false,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!open || busy) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  const danger = confirmVariant === "danger";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
        className="w-full max-w-[440px] rounded-2xl border border-line bg-panel p-6 shadow-2xl sm:p-7"
      >
        <div className="relative pr-10">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${danger ? "bg-red-bg text-red" : "bg-teal-tint text-teal"}`}
          >
            {icon}
          </span>
          <h2
            id="confirmation-modal-title"
            className="mb-0 mt-3 font-display text-sm font-normal leading-tight text-ink"
          >
            {title}
          </h2>
          <p
            id="confirmation-modal-message"
            className="mt-1 text-xs leading-[1.65] text-muted"
          >
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close confirmation"
            className="absolute -right-1 -top-1 grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-paper disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children ? <div className="mt-6 w-full">{children}</div> : null}
        {errorMessage ? (
          <p
            role="alert"
            className="mb-0 mt-3 rounded-lg bg-red-bg px-3 py-2.5 text-[12px] leading-relaxed text-red"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-10 rounded-lg border border-line px-4 text-[12px] font-medium text-ink hover:bg-paper disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy || confirmDisabled}
            style={
              danger
                ? { backgroundColor: "#b42318", color: "#ffffff" }
                : undefined
            }
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[12px] font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${danger ? "hover:brightness-90" : "bg-teal text-white hover:bg-teal-strong"}`}
          >
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : icon}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
