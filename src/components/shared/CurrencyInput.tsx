"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowNegative?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  disabled,
  allowNegative = false,
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.-]/g, "");
    if (raw === "" || raw === "-") {
      onChange(null);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(null);
      return;
    }
    if (!allowNegative && num < 0) {
      onChange(0);
      return;
    }
    onChange(num);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        $
      </span>
      <Input
        type="number"
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pl-7", className)}
        disabled={disabled}
        min={allowNegative ? undefined : 0}
        step="0.01"
      />
    </div>
  );
}
