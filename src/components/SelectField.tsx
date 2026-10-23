import { Select } from "antd";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  labelId?: string;
  ariaLabel?: string;
  describedBy?: string;
  error?: boolean;
  className?: string;
}

export function SelectField({
  id,
  value,
  options,
  onChange,
  placeholder = "Choose an option",
  labelId,
  ariaLabel,
  describedBy,
  error,
  className = "",
}: SelectFieldProps) {
  return (
    <Select<string>
      id={id}
      className={`w-full min-w-0 ${className}`}
      classNames={{
        root: error
          ? "focus-within:outline-none! focus-within:shadow-[0_0_0_3px_rgba(164,64,55,0.14)]!"
          : "focus-within:outline-none! focus-within:shadow-[0_0_0_3px_rgba(102,170,140,0.10)]!",
        input: "focus-visible:outline-none!",
        popup: {
          root: "max-w-[calc(100vw_-_30px)]",
          listItem:
            "min-h-11! [&_.ant-select-item-option-content]:whitespace-normal!",
        },
      }}
      size="large"
      value={value || undefined}
      options={options}
      placeholder={placeholder}
      onChange={onChange}
      aria-labelledby={labelId}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-invalid={error || undefined}
      status={error ? "error" : undefined}
      virtual={false}
      listHeight={320}
      popupMatchSelectWidth
    />
  );
}
