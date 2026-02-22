"use client";

import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { formatCurrency } from "@/lib/utils";
import type { WizardFormData } from "@/types";

interface Step4LoansProps {
  interestPaid: number;
  principalPaid: number;
  loanBalance: number;
  lastYear: Pick<WizardFormData, "interestPaid" | "principalPaid" | "loanBalance"> | null;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function Step4Loans({
  interestPaid,
  principalPaid,
  loanBalance,
  lastYear,
  onChange,
}: Step4LoansProps) {
  const totalDebtService = (interestPaid || 0) + (principalPaid || 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Enter yearly totals from your loan statements. Leave as $0 if not applicable.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Total Interest Paid
            {lastYear && lastYear.interestPaid > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Last year: {formatCurrency(lastYear.interestPaid)})
              </span>
            )}
          </Label>
          <CurrencyInput
            value={interestPaid}
            onChange={(v) => onChange({ interestPaid: v ?? 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Total Principal Paid
            {lastYear && lastYear.principalPaid > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Last year: {formatCurrency(lastYear.principalPaid)})
              </span>
            )}
          </Label>
          <CurrencyInput
            value={principalPaid}
            onChange={(v) => onChange({ principalPaid: v ?? 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Closing Loan Balance (optional)
            {lastYear && lastYear.loanBalance > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Last year: {formatCurrency(lastYear.loanBalance)})
              </span>
            )}
          </Label>
          <CurrencyInput
            value={loanBalance}
            onChange={(v) => onChange({ loanBalance: v ?? 0 })}
            placeholder="Loan balance at Dec 31"
          />
          <p className="text-xs text-muted-foreground">
            Used to calculate LVR and equity. Optional but recommended.
          </p>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-3 flex justify-between text-sm">
        <span className="text-muted-foreground">Total Debt Service</span>
        <span className="font-semibold">{formatCurrency(totalDebtService)}</span>
      </div>
    </div>
  );
}
