/**
 * Multi-property aggregation logic.
 * Aggregates KPIs across a set of properties for a given year.
 */

import type {
  YearlySnapshotData,
  PropertyKPIs,
  AggregatedKPIs,
  PropertySummary,
} from "@/types";
import { computeKPIs, resolveReferenceValue } from "./calculations";

interface PropertyWithData {
  property: PropertySummary & {
    valuations: Array<{ valuedAt: Date; value: number }>;
  };
  snapshot: YearlySnapshotData | null;
}

export function aggregateKPIs(
  properties: PropertyWithData[],
  year: number
): AggregatedKPIs {
  const breakdown: AggregatedKPIs["propertyBreakdown"] = [];
  const missingSnapshots: string[] = [];

  let totalGrossIncome = 0;
  let totalOpex = 0;
  let totalExpenses = 0;
  let totalNoi = 0;
  let totalCashflowPre = 0;
  let totalCashflowPost = 0;
  let totalCapex = 0;

  let totalRefValue = 0;
  let totalLoanBalance = 0;
  let refValueCount = 0;
  let loanBalanceCount = 0;

  for (const { property, snapshot } of properties) {
    if (!snapshot) {
      missingSnapshots.push(property.id);
      breakdown.push({
        propertyId: property.id,
        propertyName: property.name,
        kpis: emptyKPIs(),
        hasSnapshot: false,
      });
      continue;
    }

    const refValue = resolveReferenceValue(
      year,
      property.valuations,
      property.purchasePrice
    );
    const kpis = computeKPIs(snapshot, refValue, property.ownershipPct);

    totalGrossIncome += kpis.grossIncome;
    totalOpex += kpis.totalOpex;
    totalExpenses += kpis.totalExpenses;
    totalNoi += kpis.noi;
    totalCashflowPre += kpis.cashflowPrePrincipal;
    totalCashflowPost += kpis.cashflowPostPrincipal;
    totalCapex += kpis.capex;

    if (refValue != null) {
      totalRefValue += refValue;
      refValueCount++;
    }
    if (snapshot.loanBalance != null) {
      totalLoanBalance += Number(snapshot.loanBalance);
      loanBalanceCount++;
    }

    breakdown.push({
      propertyId: property.id,
      propertyName: property.name,
      kpis,
      hasSnapshot: true,
    });
  }

  const hasRefValues = refValueCount > 0;
  const hasLoanBalances = loanBalanceCount > 0;

  const aggRefValue = hasRefValues ? totalRefValue : null;
  const aggLoanBalance = hasLoanBalances ? totalLoanBalance : null;
  const aggEquity =
    aggRefValue != null && aggLoanBalance != null
      ? aggRefValue - aggLoanBalance
      : null;
  const avgLvr =
    aggRefValue != null && aggLoanBalance != null && aggRefValue > 0
      ? aggLoanBalance / aggRefValue
      : null;

  const grossYield =
    aggRefValue && aggRefValue > 0 ? totalGrossIncome / aggRefValue : null;
  const netYield =
    aggRefValue && aggRefValue > 0 ? totalNoi / aggRefValue : null;

  return {
    propertyCount: properties.length,
    year,
    grossIncome: totalGrossIncome,
    totalOpex,
    totalExpenses,
    noi: totalNoi,
    cashflowPrePrincipal: totalCashflowPre,
    cashflowPostPrincipal: totalCashflowPost,
    capex: totalCapex,
    totalReferenceValue: aggRefValue,
    totalLoanBalance: aggLoanBalance,
    totalEquity: aggEquity,
    avgLvr,
    grossYield,
    netYield,
    propertyBreakdown: breakdown,
    missingSnapshots,
  };
}

export function emptyKPIs(): PropertyKPIs {
  return {
    grossIncome: 0,
    rentIncome: 0,
    otherIncome: 0,
    totalOpex: 0,
    totalExpenses: 0,
    totalExpensesWithPrincipal: 0,
    noi: 0,
    cashflowPrePrincipal: 0,
    cashflowPostPrincipal: 0,
    grossYield: null,
    netYield: null,
    referenceValue: null,
    loanBalance: null,
    equity: null,
    lvr: null,
    capex: 0,
    myShareGrossIncome: 0,
    myShareNoi: 0,
    myShareCashflowPrePrincipal: 0,
    myShareCashflowPostPrincipal: 0,
  };
}

/** Build multi-year trend data for charts */
export function buildYearlyTrend(
  properties: PropertyWithData[],
  years: number[]
): Array<{
  year: number;
  grossIncome: number;
  totalOpex: number;
  noi: number;
  cashflowPre: number;
}> {
  return years.map((year) => {
    const agg = aggregateKPIs(properties, year);
    return {
      year,
      grossIncome: agg.grossIncome,
      totalOpex: agg.totalOpex,
      noi: agg.noi,
      cashflowPre: agg.cashflowPrePrincipal,
    };
  });
}
