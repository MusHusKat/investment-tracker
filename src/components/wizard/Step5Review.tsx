"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { computeKPIs } from "@/lib/calculations";
import type { WizardFormData, YearlySnapshotData } from "@/types";

interface Step5ReviewProps {
  form: WizardFormData;
  propertyName: string;
}

export function Step5Review({ form, propertyName }: Step5ReviewProps) {
  const snap: YearlySnapshotData = {
    id: "",
    propertyId: form.propertyId,
    year: form.year,
    rentIncome: form.rentIncome || null,
    otherIncome: form.otherIncome || null,
    maintenance: form.maintenance || null,
    insurance: form.insurance || null,
    councilRates: form.councilRates || null,
    strataFees: form.strataFees || null,
    propertyMgmtFees: form.propertyMgmtFees || null,
    utilities: form.utilities || null,
    otherExpenses: form.otherExpenses || null,
    interestPaid: form.interestPaid || null,
    principalPaid: form.principalPaid || null,
    capex: form.capex || null,
    loanBalance: form.loanBalance || null,
    notes: form.notes || null,
  };

  const kpis = computeKPIs(snap, null, 100);

  const rows: Array<[string, number, boolean?]> = [
    ["Rent Income", form.rentIncome],
    ["Other Income", form.otherIncome],
    ["─ Gross Income ─", kpis.grossIncome, true],
    ["Maintenance", form.maintenance],
    ["Insurance", form.insurance],
    ["Council Rates", form.councilRates],
    ["Strata Fees", form.strataFees],
    ["PM Fees", form.propertyMgmtFees],
    ["Utilities", form.utilities],
    ["Other Expenses", form.otherExpenses],
    ["─ Total Opex ─", kpis.totalOpex, true],
    ["Interest Paid", form.interestPaid],
    ["Principal Paid", form.principalPaid],
    ["Capex", form.capex],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{propertyName}</p>
          <p className="text-sm text-muted-foreground">Year: {form.year}</p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        {rows.map(([label, value, isBold]) =>
          value ? (
            <div
              key={label}
              className={`flex justify-between ${isBold ? "font-semibold pt-1" : ""}`}
            >
              <span className={isBold ? "" : "text-muted-foreground"}>{label}</span>
              <span>{formatCurrency(value as number)}</span>
            </div>
          ) : null
        )}
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Net Operating Income</span>
          <span className={kpis.noi >= 0 ? "text-emerald-600" : "text-red-600"}>
            {formatCurrency(kpis.noi)}
          </span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Cashflow (pre-principal)</span>
          <span className={kpis.cashflowPrePrincipal >= 0 ? "text-emerald-600" : "text-red-600"}>
            {formatCurrency(kpis.cashflowPrePrincipal)}
          </span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Cashflow (post-principal)</span>
          <span className={kpis.cashflowPostPrincipal >= 0 ? "text-emerald-600" : "text-red-600"}>
            {formatCurrency(kpis.cashflowPostPrincipal)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => {
            // This component doesn't have direct onChange, but Step5 is display-only
            // Notes are edited inline here for the saved record
          }}
          placeholder="Any notes for this year..."
          rows={3}
          readOnly
        />
      </div>
    </div>
  );
}
