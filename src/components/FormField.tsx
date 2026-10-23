import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div
      className="relative min-w-0"
      data-ui="field"
      data-invalid={error ? true : undefined}
    >
      <div
        className="mb-2.5 flex items-baseline justify-between gap-3"
        data-ui="field-heading"
      >
        <label
          id={`${id}-label`}
          htmlFor={id}
          className="text-[12px] font-medium leading-relaxed text-ink"
        >
          {label}
          {required ? (
            <span className="text-red" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
        {optional ? (
          <span className="text-[10px] font-normal text-soft">Optional</span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p
          className="mt-2 mb-0 text-[10px] leading-[1.7] text-muted"
          data-ui="field-hint"
          id={hintId}
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-2 mb-0 text-[11px] font-medium leading-relaxed text-red"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  max?: string;
  error?: string;
  hintId?: string;
  suffix?: string;
  type?: "text" | "textarea";
  rows?: number;
  autoComplete?: string;
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
  disabled,
  maxLength,
  max,
  error,
  hintId,
  suffix,
  type,
  rows = 3,
  autoComplete = "off",
}: InputProps) {
  const common = {
    id,
    value,
    placeholder,
    disabled,
    maxLength,
    "aria-invalid": !!error,
    "aria-describedby":
      [hintId, error ? `${id}-error` : undefined].filter(Boolean).join(" ") ||
      undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.currentTarget.value),
  };
  return (
    <div
      className="relative [&[data-has-suffix=true]_input]:pr-[72px]"
      data-ui="input-shell"
      data-has-suffix={suffix ? true : undefined}
    >
      {type === "textarea" ? (
        <textarea
          {...common}
          rows={rows}
          maxLength={maxLength ?? 300}
          className="min-h-[105px] w-full resize-y rounded-lg border border-line bg-panel px-3.5 py-3 text-[13px] leading-[1.8] text-ink transition-shadow placeholder:text-[#9aadb0] focus-visible:outline-none! focus:border-teal focus:shadow-[0_0_0_3px_rgba(102,170,140,0.10)] aria-invalid:border-2 aria-invalid:border-red aria-invalid:focus:border-red aria-invalid:focus:shadow-[0_0_0_3px_rgba(164,64,55,0.14)]"
        />
      ) : (
        <input
          {...common}
          type="text"
          inputMode={inputMode}
          autoComplete={autoComplete}
          max={max}
          className="h-[46px] w-full rounded-lg border border-line bg-panel px-3.5 text-[13px] text-ink transition-shadow placeholder:text-[#9aadb0] focus-visible:outline-none! focus:border-teal focus:shadow-[0_0_0_3px_rgba(102,170,140,0.10)] aria-invalid:border-2 aria-invalid:border-red aria-invalid:focus:border-red aria-invalid:focus:shadow-[0_0_0_3px_rgba(164,64,55,0.14)]"
        />
      )}
      {suffix ? (
        <span
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[10px] text-muted"
          aria-hidden="true"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
