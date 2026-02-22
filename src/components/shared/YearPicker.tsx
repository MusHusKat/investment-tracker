"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { yearRange, currentYear } from "@/lib/utils";

interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
}

export function YearPicker({
  value,
  onChange,
  minYear = 2010,
  maxYear = currentYear() + 1,
  placeholder = "Select year",
}: YearPickerProps) {
  const years = yearRange(minYear, maxYear);

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(parseInt(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
