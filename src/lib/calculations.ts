/**
 * Pure calculation functions for property investment KPIs.
 * No database dependencies — fully unit-testable.
 */

import type { YearlySnapshotData, PropertyKPIs, YoYDelta } from "@/types";
import { pctToRatio } from "./utils";

const n = (v: number | null | undefined): number => v ?? 0;

// ─── Income ──────────────────────────────────────────────────────────────────

export function calcGrossIncome(snap: YearlySnapshotData): number {
  return n(snap.rentIncome) + n(snap.otherIncome);
}

// ─── Expenses ────────────────────────────────────────────────────────────────

/** Operating expenses = everything EXCEPT interest, principal, capex */
export function calcTotalOpex(snap: YearlySnapshotData): number {
  return (
    n(snap.maintenance) +
    n(snap.insurance) +
    n(snap.councilRates) +
    n(snap.strataFees) +
    n(snap.propertyMgmtFees) +
    n(snap.utilities) +
    n(snap.otherExpenses)
  );
}

/** All cash out including interest but not principal (not a "cash" expense per se, but included for full picture) */
export function calcTotalExpenses(snap: YearlySnapshotData): number {
  return calcTotalOpex(snap) + n(snap.interestPaid);
}

export function calcTotalExpensesWithPrincipal(snap: YearlySnapshotData): number {
  return calcTotalExpenses(snap) + n(snap.principalPaid);
}

// ─── Profit measures ─────────────────────────────────────────────────────────

/** Net Operating Income: gross income minus operating expenses (before debt service) */
export function calcNOI(snap: YearlySnapshotData): number {
  return calcGrossIncome(snap) - calcTotalOpex(snap);
}

/** Cash-flow before principal repayment */
export function calcCashflowPrePrincipal(snap: YearlySnapshotData): number {
  return calcGrossIncome(snap) - calcTotalOpex(snap) - n(snap.interestPaid);
}

/** Cash-flow after principal repayment */
export function calcCashflowPostPrincipal(snap: YearlySnapshotData): number {
  return calcCashflowPrePrincipal(snap) - n(snap.principalPaid);
}

// ─── Yields ──────────────────────────────────────────────────────────────────

/**
 * Gross yield = annual rent / reference value
 * Reference value = latest valuation if available, else purchase price.
 */
export function calcGrossYield(
  snap: YearlySnapshotData,
  referenceValue: number | null
): number | null {
  if (!referenceValue || referenceValue === 0) return null;
  return n(snap.rentIncome) / referenceValue;
}

/**
 * Net yield = NOI / reference value
 */
export function calcNetYield(
  snap: YearlySnapshotData,
  referenceValue: number | null
): number | null {
  if (!referenceValue || referenceValue === 0) return null;
  return calcNOI(snap) / referenceValue;
}

// ─── Debt ─────────────────────────────────────────────────────────────────────

export function calcEquity(
  referenceValue: number | null,
  loanBalance: number | null
): number | null {
  if (referenceValue == null || loanBalance == null) return null;
  return referenceValue - loanBalance;
}

export function calcLVR(
  referenceValue: number | null,
  loanBalance: number | null
): number | null {
  if (referenceValue == null || loanBalance == null || referenceValue === 0) return null;
  return loanBalance / referenceValue;
}

// ─── Full KPI object ─────────────────────────────────────────────────────────

export function computeKPIs(
  snap: YearlySnapshotData,
  referenceValue: number | null,
  ownershipPct: number = 100
): PropertyKPIs {
  const ratio = pctToRatio(ownershipPct);

  const grossIncome = calcGrossIncome(snap);
  const totalOpex = calcTotalOpex(snap);
  const totalExpenses = calcTotalExpenses(snap);
  const totalExpensesWithPrincipal = calcTotalExpensesWithPrincipal(snap);
  const noi = calcNOI(snap);
  const cashflowPrePrincipal = calcCashflowPrePrincipal(snap);
  const cashflowPostPrincipal = calcCashflowPostPrincipal(snap);

  const grossYield = calcGrossYield(snap, referenceValue);
  const netYield = calcNetYield(snap, referenceValue);

  const loanBalance = snap.loanBalance != null ? n(snap.loanBalance) : null;
  const equity = calcEquity(referenceValue, loanBalance);
  const lvr = calcLVR(referenceValue, loanBalance);

  return {
    grossIncome,
    rentIncome: n(snap.rentIncome),
    otherIncome: n(snap.otherIncome),

    totalOpex,
    totalExpenses,
    totalExpensesWithPrincipal,

    noi,
    cashflowPrePrincipal,
    cashflowPostPrincipal,

    grossYield,
    netYield,
    referenceValue,

    loanBalance,
    equity,
    lvr,

    capex: n(snap.capex),

    // Ownership-adjusted
    myShareGrossIncome: grossIncome * ratio,
    myShareNoi: noi * ratio,
    myShareCashflowPrePrincipal: cashflowPrePrincipal * ratio,
    myShareCashflowPostPrincipal: cashflowPostPrincipal * ratio,
  };
}

// ─── YoY Delta ───────────────────────────────────────────────────────────────

export function calcYoYDelta(
  metricKey: string,
  current: number | null,
  previous: number | null,
  largeChangePct = 0.2
): YoYDelta {
  if (current == null || previous == null) {
    return { metric: metricKey, current, previous, delta: null, deltaPct: null, isLarge: false };
  }

  const delta = current - previous;
  const deltaPct = previous !== 0 ? delta / Math.abs(previous) : null;
  const isLarge = deltaPct != null && Math.abs(deltaPct) > largeChangePct;

  return { metric: metricKey, current, previous, delta, deltaPct, isLarge };
}

export function computeYoYDeltas(
  current: PropertyKPIs,
  previous: PropertyKPIs | null
): YoYDelta[] {
  if (!previous) return [];

  const pairs: Array<[string, keyof PropertyKPIs]> = [
    ["Gross Income", "grossIncome"],
    ["NOI", "noi"],
    ["Cashflow (pre-principal)", "cashflowPrePrincipal"],
    ["Cashflow (post-principal)", "cashflowPostPrincipal"],
    ["Total Opex", "totalOpex"],
    ["Interest Paid", "totalExpenses"],
  ];

  return pairs.map(([label, key]) =>
    calcYoYDelta(
      label,
      current[key] as number | null,
      previous[key] as number | null
    )
  );
}

// ─── Reference value resolution ──────────────────────────────────────────────

/**
 * Given a list of valuations (sorted desc by date) and a calendar year,
 * return the most recent valuation value on or before Dec 31 of that year.
 * Falls back to purchase price if no valuation found.
 */
export function resolveReferenceValue(
  year: number,
  valuations: Array<{ valuedAt: Date; value: number }>,
  purchasePrice: number | null
): number | null {
  const cutoff = new Date(`${year}-12-31`);
  const prior = valuations
    .filter((v) => new Date(v.valuedAt) <= cutoff)
    .sort((a, b) => new Date(b.valuedAt).getTime() - new Date(a.valuedAt).getTime());

  if (prior.length > 0) return prior[0].value;
  return purchasePrice;
}
