import { KpiCard } from "./KpiCard";
import type { AggregatedKPIs } from "@/types";
import { formatPercent } from "@/lib/utils";

interface KpiGridProps {
  current: AggregatedKPIs;
  previous?: AggregatedKPIs | null;
}

function yoyDelta(curr: number, prev: number | undefined): number | null {
  if (prev == null || prev === 0) return null;
  return (curr - prev) / Math.abs(prev);
}

export function KpiGrid({ current, previous }: KpiGridProps) {
  const p = previous;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <KpiCard
        title="Gross Income"
        value={current.grossIncome}
        delta={yoyDelta(current.grossIncome, p?.grossIncome)}
      />
      <KpiCard
        title="Total Opex"
        value={current.totalOpex}
        delta={yoyDelta(current.totalOpex, p?.totalOpex)}
        highlight="neutral"
      />
      <KpiCard
        title="Net Operating Income"
        value={current.noi}
        delta={yoyDelta(current.noi, p?.noi)}
      />
      <KpiCard
        title="Cashflow (pre-principal)"
        value={current.cashflowPrePrincipal}
        delta={yoyDelta(current.cashflowPrePrincipal, p?.cashflowPrePrincipal)}
      />
      <KpiCard
        title="Cashflow (post-principal)"
        value={current.cashflowPostPrincipal}
        delta={yoyDelta(current.cashflowPostPrincipal, p?.cashflowPostPrincipal)}
      />
      <KpiCard
        title="Gross Yield"
        value={current.grossYield}
        format="percent"
        delta={yoyDelta(current.grossYield ?? 0, p?.grossYield ?? undefined)}
        highlight="neutral"
      />
      <KpiCard
        title="Net Yield"
        value={current.netYield}
        format="percent"
        delta={yoyDelta(current.netYield ?? 0, p?.netYield ?? undefined)}
        highlight="neutral"
      />
      <KpiCard
        title="Portfolio Value"
        value={current.totalReferenceValue}
        highlight="neutral"
        subtitle={current.avgLvr != null ? `LVR ${formatPercent(current.avgLvr)}` : undefined}
      />
      {current.totalEquity != null && (
        <KpiCard
          title="Total Equity"
          value={current.totalEquity}
          highlight="positive"
        />
      )}
    </div>
  );
}
