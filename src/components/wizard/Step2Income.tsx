"use client";

import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { formatCurrency } from "@/lib/utils";

interface Step2IncomeProps {
  rentIncome: number;
  otherIncome: number;
  lastYear: { rent: number; other: number } | null;
  onChange: (patch: { rentIncome?: number; otherIncome?: number }) => void;
}

export function Step2Income({
  rentIncome,
  otherIncome,
  lastYear,
  onChange,
}: Step2IncomeProps) {
  const grossIncome = (rentIncome || 0) + (otherIncome || 0);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>
          Annual Rent Income
          {lastYear && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Last year: {formatCurrency(lastYear.rent)})
            </span>
          )}
        </Label>
        <CurrencyInput
          value={rentIncome}
          onChange={(v) => onChange({ rentIncome: v ?? 0 })}
          placeholder="0"
        />
        {lastYear && lastYear.rent > 0 && rentIncome > 0 && (
          <YoYHint current={rentIncome} prev={lastYear.rent} label="rent" />
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Other Income
          {lastYear && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Last year: {formatCurrency(lastYear.other)})
            </span>
          )}
        </Label>
        <CurrencyInput
          value={otherIncome}
          onChange={(v) => onChange({ otherIncome: v ?? 0 })}
          placeholder="0"
        />
      </div>

      <div className="rounded-md bg-muted/50 p-3 flex justify-between text-sm">
        <span className="text-muted-foreground">Gross Income</span>
        <span className="font-semibold">{formatCurrency(grossIncome)}</span>
      </div>
    </div>
  );
}

function YoYHint({ current, prev, label }: { current: number; prev: number; label: string }) {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const isLarge = Math.abs(pct) > 20;

  return (
    <p
      className={`text-xs ${
        pct > 0
          ? isLarge
            ? "text-amber-600 font-semibold"
            : "text-emerald-600"
          : isLarge
          ? "text-red-600 font-semibold"
          : "text-muted-foreground"
      }`}
    >
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}% YoY for {label}
      {isLarge && " ⚠ Large change"}
    </p>
  );
}
