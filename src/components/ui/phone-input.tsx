"use client";

import { useState } from "react";
import { formatIndianPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  id?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (formattedValue: string) => void;
  required?: boolean;
  className?: string;
}

export function PhoneInput({
  id,
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  required = false,
  className,
  placeholder = "+91 98765 43210",
  ...props
}: PhoneInputProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    return defaultValue ? formatIndianPhone(defaultValue) : "";
  });

  const displayValue = isControlled
    ? formatIndianPhone(controlledValue || "")
    : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow user to clear completely if they delete down to just the prefix
    let formatted = "";
    if (raw === "" || raw === "+" || raw === "+9" || raw === "+91" || raw === "+91 ") {
      formatted = "";
    } else {
      formatted = formatIndianPhone(raw);
    }

    if (!isControlled) {
      setInternalValue(formatted);
    }

    onChange?.(formatted);
  };

  return (
    <div className="relative w-full">
      <input
        type="tel"
        id={id}
        name={name}
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={16}
        autoComplete="tel"
        className={cn(
          "w-full rounded-lg border border-border bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 font-mono text-xs sm:text-sm text-text placeholder:text-muted transition-all scroll-mt-28",
          "hover:border-border-strong hover:bg-surface-2",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40",
          className
        )}
        {...props}
      />
    </div>
  );
}
