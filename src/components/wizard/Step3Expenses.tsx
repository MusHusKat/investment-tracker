"use client";

import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { formatCurrency } from "@/lib/utils";
import type { WizardFormData } from "@/types";

type ExpenseKey =
  | "maintenance"
  | "insurance"
  | "councilRates"
  | "strataFees"
  | "propertyMgmtFees"
  | "utilities"
  | "otherExpenses"
  | "capex";

const EXPENSE_FIELDS: Array<{ key: ExpenseKey; label: string }> = [
  { key: "maintenance", label: "Maintenance & Repairs" },
  { key: "insurance", label: "Insurance" },
  { key: "councilRates", label: "Council Rates" },
  { key: "strataFees", label: "Strata Fees" },
  { key: "propertyMgmtFees", label: "Property Mgmt Fees" },
  { key: "utilities", label: "Utilities" },
  { key: "otherExpenses", label: "Other Expenses" },
  { key: "capex", label: "Capital Expenditure" },
];

interface Step3ExpensesProps {
  values: Pick<WizardFormData, ExpenseKey>;
  lastYear: Pick<WizardFormData, ExpenseKey> | null;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function Step3Expenses({ values, lastYear, onChange }: Step3ExpensesProps) {
  const totalOpex = EXPENSE_FIELDS.filter((f) => f.key !== "capex").reduce(
    (sum, f) => sum + (values[f.key] || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {EXPENSE_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label>
              {label}
              {lastYear && lastYear[key] > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({formatCurrency(lastYear[key])})
                </span>
              )}
            </Label>
            <CurrencyInput
              value={values[key]}
              onChange={(v) => onChange({ [key]: v ?? 0 })}
            />
          </div>
        ))}
      </div>

      <div className="rounded-md bg-muted/50 p-3 flex justify-between text-sm mt-2">
        <span className="text-muted-foreground">Total Operating Expenses</span>
        <span className="font-semibold">{formatCurrency(totalOpex)}</span>
      </div>

      {lastYear && (
        <p className="text-xs text-muted-foreground">
          Figures in parentheses are last year&apos;s values (pre-filled baseline).
        </p>
      )}
    </div>
  );
}
