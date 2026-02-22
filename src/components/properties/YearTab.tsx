"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { YearlySnapshotData, PropertyKPIs, YoYDelta } from "@/types";
import { computeYoYDeltas } from "@/lib/calculations";
import { deleteSnapshot } from "@/lib/actions/snapshots";
import { useRouter } from "next/navigation";
import { Wand2, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface YearTabProps {
  propertyId: string;
  year: number;
  snapshot: YearlySnapshotData | null;
  kpis: PropertyKPIs | null;
  prevKpis: PropertyKPIs | null;
  refValue: number | null;
  ownershipPct: number;
}

export function YearTab({
  propertyId,
  year,
  snapshot,
  kpis,
  prevKpis,
  refValue,
  ownershipPct,
}: YearTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const yoyDeltas = kpis && prevKpis ? computeYoYDeltas(kpis, prevKpis) : [];

  if (!snapshot || !kpis) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-muted-foreground">No data for {year}</p>
          <Link href={`/wizard?propertyId=${propertyId}&year=${year}`}>
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Add {year} Data
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const n = (v: number | null) => v ?? 0;

  const incomeRows = [
    { label: "Rent Income", value: n(snapshot.rentIncome) },
    { label: "Other Income", value: n(snapshot.otherIncome) },
  ];

  const expenseRows = [
    { label: "Maintenance & Repairs", value: n(snapshot.maintenance) },
    { label: "Insurance", value: n(snapshot.insurance) },
    { label: "Council Rates", value: n(snapshot.councilRates) },
    { label: "Strata Fees", value: n(snapshot.strataFees) },
    { label: "Property Mgmt Fees", value: n(snapshot.propertyMgmtFees) },
    { label: "Utilities", value: n(snapshot.utilities) },
    { label: "Other Expenses", value: n(snapshot.otherExpenses) },
  ];

  const handleDelete = () => {
    if (!confirm(`Delete data for ${year}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteSnapshot(snapshot.id);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* KPI Summary */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">KPI Summary — {year}</CardTitle>
            <div className="flex gap-2">
              <Link href={`/wizard?propertyId=${propertyId}&year=${year}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {refValue && (
            <p className="text-xs text-muted-foreground">
              Reference value: {formatCurrency(refValue)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <KpiItem label="Gross Income" value={kpis.grossIncome} />
            <KpiItem label="Total Opex" value={kpis.totalOpex} />
            <KpiItem label="NOI" value={kpis.noi} colored />
            <KpiItem label="Interest Paid" value={n(snapshot.interestPaid)} />
            <KpiItem label="Cashflow (pre-principal)" value={kpis.cashflowPrePrincipal} colored />
            <KpiItem label="Cashflow (post-principal)" value={kpis.cashflowPostPrincipal} colored />
            <KpiItem label="Gross Yield" value={kpis.grossYield} format="percent" />
            <KpiItem label="Net Yield" value={kpis.netYield} format="percent" />
            {kpis.loanBalance != null && (
              <KpiItem label="Loan Balance" value={kpis.loanBalance} />
            )}
            {kpis.equity != null && (
              <KpiItem label="Equity" value={kpis.equity} colored />
            )}
            {kpis.lvr != null && (
              <KpiItem label="LVR" value={kpis.lvr} format="percent" />
            )}
            {kpis.capex > 0 && (
              <KpiItem label="Capex" value={kpis.capex} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* YoY Delta */}
      {yoyDeltas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Year-on-Year Changes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {yoyDeltas.map((d) => (
                <DeltaRow key={d.metric} delta={d} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Income</CardTitle></CardHeader>
        <CardContent>
          <LineItems rows={incomeRows} total={kpis.grossIncome} totalLabel="Gross Income" />
        </CardContent>
      </Card>

      {/* Expense breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Expenses</CardTitle></CardHeader>
        <CardContent>
          <LineItems rows={expenseRows} total={kpis.totalOpex} totalLabel="Total Opex" />
          {n(snapshot.interestPaid) > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Paid</span>
                <span>{formatCurrency(n(snapshot.interestPaid))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal Paid</span>
                <span>{formatCurrency(n(snapshot.principalPaid))}</span>
              </div>
            </>
          )}
          {n(snapshot.capex) > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capex</span>
                <span>{formatCurrency(n(snapshot.capex))}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {snapshot.notes && (
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{snapshot.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sub-components

function KpiItem({
  label,
  value,
  format = "currency",
  colored = false,
}: {
  label: string;
  value: number | null;
  format?: "currency" | "percent";
  colored?: boolean;
}) {
  const display =
    value == null
      ? "—"
      : format === "currency"
      ? formatCurrency(value)
      : formatPercent(value);

  return (
    <div className="p-3 rounded-md bg-muted/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-semibold mt-0.5",
          colored && value != null && value > 0 && "text-emerald-600",
          colored && value != null && value < 0 && "text-red-600"
        )}
      >
        {display}
      </p>
    </div>
  );
}

function LineItems({
  rows,
  total,
  totalLabel,
}: {
  rows: Array<{ label: string; value: number }>;
  total: number;
  totalLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      {rows
        .filter((r) => r.value !== 0)
        .map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span>{formatCurrency(r.value)}</span>
          </div>
        ))}
      <Separator className="my-1" />
      <div className="flex justify-between text-sm font-medium">
        <span>{totalLabel}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function DeltaRow({ delta }: { delta: YoYDelta }) {
  if (delta.deltaPct == null) return null;
  const isUp = delta.deltaPct > 0;
  const isDown = delta.deltaPct < 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{delta.metric}</span>
      <div className="flex items-center gap-1.5">
        {isUp ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        ) : isDown ? (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span
          className={cn(
            "font-medium",
            isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-muted-foreground",
            delta.isLarge && "font-bold"
          )}
        >
          {isUp ? "+" : ""}{(delta.deltaPct * 100).toFixed(1)}%
        </span>
        {delta.isLarge && (
          <Badge variant="warning" className="text-xs py-0">large</Badge>
        )}
      </div>
    </div>
  );
}
