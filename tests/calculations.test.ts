import { describe, it, expect } from "vitest";
import {
  calcGrossIncome,
  calcTotalOpex,
  calcNOI,
  calcCashflowPrePrincipal,
  calcCashflowPostPrincipal,
  calcGrossYield,
  calcNetYield,
  calcEquity,
  calcLVR,
  computeKPIs,
  resolveReferenceValue,
  calcYoYDelta,
} from "../src/lib/calculations";
import type { YearlySnapshotData } from "../src/types";

function makeSnap(overrides: Partial<YearlySnapshotData> = {}): YearlySnapshotData {
  return {
    id: "test",
    propertyId: "prop1",
    year: 2024,
    rentIncome: 48000,
    otherIncome: 1200,
    maintenance: 2000,
    insurance: 1800,
    councilRates: 1600,
    strataFees: 4800,
    propertyMgmtFees: 3600,
    utilities: 0,
    otherExpenses: 500,
    interestPaid: 52000,
    principalPaid: 9000,
    capex: 5000,
    loanBalance: 820000,
    notes: null,
    ...overrides,
  };
}

// ─── Test 1: Income calculation ───────────────────────────────────────────────

describe("calcGrossIncome", () => {
  it("sums rent and other income", () => {
    const snap = makeSnap({ rentIncome: 48000, otherIncome: 1200 });
    expect(calcGrossIncome(snap)).toBe(49200);
  });

  it("handles null other income", () => {
    const snap = makeSnap({ rentIncome: 36000, otherIncome: null });
    expect(calcGrossIncome(snap)).toBe(36000);
  });

  it("handles all null income", () => {
    const snap = makeSnap({ rentIncome: null, otherIncome: null });
    expect(calcGrossIncome(snap)).toBe(0);
  });
});

// ─── Test 2: Operating expense calculation ────────────────────────────────────

describe("calcTotalOpex", () => {
  it("sums all operating expense categories", () => {
    const snap = makeSnap({
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 500,
      otherExpenses: 300,
    });
    expect(calcTotalOpex(snap)).toBe(14600);
  });

  it("excludes interest, principal, and capex from opex", () => {
    const snap = makeSnap({
      maintenance: 1000,
      insurance: 0,
      councilRates: 0,
      strataFees: 0,
      propertyMgmtFees: 0,
      utilities: 0,
      otherExpenses: 0,
      interestPaid: 50000, // should NOT be in opex
      principalPaid: 10000, // should NOT be in opex
      capex: 20000, // should NOT be in opex
    });
    expect(calcTotalOpex(snap)).toBe(1000);
  });
});

// ─── Test 3: NOI calculation ──────────────────────────────────────────────────

describe("calcNOI", () => {
  it("calculates NOI as grossIncome minus opex", () => {
    const snap = makeSnap({
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 0,
    });
    // grossIncome = 48000, opex = 13800
    expect(calcNOI(snap)).toBe(34200);
  });

  it("can be negative for high-expense properties", () => {
    const snap = makeSnap({
      rentIncome: 10000,
      otherIncome: 0,
      maintenance: 20000,
      insurance: 0,
      councilRates: 0,
      strataFees: 0,
      propertyMgmtFees: 0,
      utilities: 0,
      otherExpenses: 0,
    });
    expect(calcNOI(snap)).toBe(-10000);
  });
});

// ─── Test 4: Cashflow calculations ───────────────────────────────────────────

describe("cashflow calculations", () => {
  it("calculates pre-principal cashflow", () => {
    const snap = makeSnap({
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 0,
      interestPaid: 52000,
      principalPaid: 9000,
    });
    // gross=48000, opex=13800, interest=52000
    // cashflow_pre = 48000 - 13800 - 52000 = -17800
    expect(calcCashflowPrePrincipal(snap)).toBe(-17800);
  });

  it("calculates post-principal cashflow (further reduces)", () => {
    const snap = makeSnap({
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 0,
      interestPaid: 52000,
      principalPaid: 9000,
    });
    // cashflow_post = -17800 - 9000 = -26800
    expect(calcCashflowPostPrincipal(snap)).toBe(-26800);
  });

  it("positive cashflow for high-yield properties", () => {
    const snap = makeSnap({
      rentIncome: 60000,
      otherIncome: 0,
      maintenance: 1000,
      insurance: 500,
      councilRates: 500,
      strataFees: 0,
      propertyMgmtFees: 0,
      utilities: 0,
      otherExpenses: 0,
      interestPaid: 10000,
      principalPaid: 5000,
    });
    // gross=60000, opex=2000, cashflow_pre=48000
    expect(calcCashflowPrePrincipal(snap)).toBe(48000);
    expect(calcCashflowPostPrincipal(snap)).toBe(43000);
  });
});

// ─── Test 5: Yield calculations ───────────────────────────────────────────────

describe("yield calculations", () => {
  it("calculates gross yield correctly", () => {
    const snap = makeSnap({ rentIncome: 48000 });
    const yield_ = calcGrossYield(snap, 960000);
    expect(yield_).toBeCloseTo(0.05, 4); // 5%
  });

  it("returns null when reference value is zero", () => {
    const snap = makeSnap({ rentIncome: 48000 });
    expect(calcGrossYield(snap, 0)).toBeNull();
    expect(calcGrossYield(snap, null)).toBeNull();
  });

  it("calculates net yield on NOI", () => {
    const snap = makeSnap({
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 0,
    });
    // NOI = 48000 - 13800 = 34200, ref = 960000
    const netYield = calcNetYield(snap, 960000);
    expect(netYield).toBeCloseTo(34200 / 960000, 6);
  });
});

// ─── Test 6: Debt / LVR calculations ─────────────────────────────────────────

describe("debt calculations", () => {
  it("calculates equity", () => {
    expect(calcEquity(950000, 750000)).toBe(200000);
    expect(calcEquity(null, 750000)).toBeNull();
    expect(calcEquity(950000, null)).toBeNull();
  });

  it("calculates LVR as ratio", () => {
    const lvr = calcLVR(1000000, 700000);
    expect(lvr).toBeCloseTo(0.7, 4);
  });

  it("returns null for zero reference value", () => {
    expect(calcLVR(0, 700000)).toBeNull();
  });
});

// ─── Test 7: Full KPI computation ────────────────────────────────────────────

describe("computeKPIs", () => {
  it("applies ownership percentage to my-share metrics", () => {
    const snap = makeSnap({
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 0,
      interestPaid: 52000,
      principalPaid: 9000,
    });
    const kpis50 = computeKPIs(snap, null, 50);
    const kpis100 = computeKPIs(snap, null, 100);

    expect(kpis50.myShareGrossIncome).toBe(kpis100.grossIncome / 2);
    expect(kpis50.myShareNoi).toBe(kpis100.noi / 2);
  });

  it("includes full cashflow regardless of ownership", () => {
    const snap = makeSnap();
    const kpis = computeKPIs(snap, null, 75);
    // Full cashflow should not be ownership-adjusted
    expect(kpis.cashflowPrePrincipal).toBe(calcCashflowPrePrincipal(snap));
  });
});

// ─── Test 8: Reference value resolution ──────────────────────────────────────

describe("resolveReferenceValue", () => {
  it("returns most recent valuation on or before year end", () => {
    const valuations = [
      { valuedAt: new Date("2024-06-30"), value: 980000 },
      { valuedAt: new Date("2023-06-30"), value: 920000 },
    ];
    expect(resolveReferenceValue(2024, valuations, 750000)).toBe(980000);
    expect(resolveReferenceValue(2023, valuations, 750000)).toBe(920000);
    expect(resolveReferenceValue(2022, valuations, 750000)).toBe(750000); // falls back to purchase
  });

  it("falls back to purchase price when no prior valuation", () => {
    const valuations = [{ valuedAt: new Date("2025-01-01"), value: 1200000 }];
    expect(resolveReferenceValue(2024, valuations, 750000)).toBe(750000);
  });

  it("returns null when no valuations and no purchase price", () => {
    expect(resolveReferenceValue(2024, [], null)).toBeNull();
  });
});

// ─── Test 9: YoY delta ────────────────────────────────────────────────────────

describe("calcYoYDelta", () => {
  it("calculates delta and percentage correctly", () => {
    const delta = calcYoYDelta("Gross Income", 52000, 48000);
    expect(delta.delta).toBe(4000);
    expect(delta.deltaPct).toBeCloseTo(4000 / 48000, 6);
    expect(delta.isLarge).toBe(false);
  });

  it("flags large changes above 20%", () => {
    const delta = calcYoYDelta("Rent", 62000, 48000);
    expect(delta.isLarge).toBe(true); // ~29% increase
  });

  it("handles null values gracefully", () => {
    const delta = calcYoYDelta("NOI", null, 5000);
    expect(delta.delta).toBeNull();
    expect(delta.deltaPct).toBeNull();
    expect(delta.isLarge).toBe(false);
  });

  it("handles zero previous value", () => {
    const delta = calcYoYDelta("Income", 1000, 0);
    expect(delta.deltaPct).toBeNull(); // can't divide by zero
  });
});
