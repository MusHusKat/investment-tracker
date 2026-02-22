import { describe, it, expect } from "vitest";
import { aggregateKPIs, buildYearlyTrend } from "../src/lib/aggregations";
import type { YearlySnapshotData } from "../src/types";

function makePropData(
  id: string,
  name: string,
  snap: Partial<YearlySnapshotData> | null,
  year: number,
  purchasePrice = 800000,
  ownershipPct = 100
) {
  return {
    property: {
      id,
      name,
      address: null,
      tags: [],
      purchaseDate: null,
      purchasePrice,
      ownershipPct,
      isActive: true,
      valuations: [] as Array<{ valuedAt: Date; value: number }>,
    },
    snapshot: snap
      ? ({
          id: `snap_${id}`,
          propertyId: id,
          year,
          rentIncome: 0,
          otherIncome: 0,
          maintenance: 0,
          insurance: 0,
          councilRates: 0,
          strataFees: 0,
          propertyMgmtFees: 0,
          utilities: 0,
          otherExpenses: 0,
          interestPaid: 0,
          principalPaid: 0,
          capex: 0,
          loanBalance: null,
          notes: null,
          ...snap,
        } as YearlySnapshotData)
      : null,
  };
}

// ─── Test 1: Aggregation with two properties ──────────────────────────────────

describe("aggregateKPIs", () => {
  it("correctly sums income across two properties", () => {
    const props = [
      makePropData("p1", "Prop 1", { rentIncome: 36000, otherIncome: 0 }, 2024),
      makePropData("p2", "Prop 2", { rentIncome: 48000, otherIncome: 1200 }, 2024),
    ];

    const agg = aggregateKPIs(props, 2024);

    expect(agg.grossIncome).toBe(85200);
    expect(agg.propertyCount).toBe(2);
    expect(agg.missingSnapshots).toHaveLength(0);
  });

  it("identifies properties with missing snapshots", () => {
    const props = [
      makePropData("p1", "Prop 1", { rentIncome: 36000 }, 2024),
      makePropData("p2", "Prop 2", null, 2024), // no snapshot
    ];

    const agg = aggregateKPIs(props, 2024);

    expect(agg.missingSnapshots).toContain("p2");
    expect(agg.missingSnapshots).toHaveLength(1);
  });

  it("aggregated NOI matches sum of individual NOIs", () => {
    const props = [
      makePropData("p1", "Prop 1", {
        rentIncome: 36000,
        maintenance: 2000,
        insurance: 1000,
        councilRates: 0,
        strataFees: 0,
        propertyMgmtFees: 2700,
        utilities: 0,
        otherExpenses: 0,
      }, 2024),
      makePropData("p2", "Prop 2", {
        rentIncome: 60000,
        maintenance: 3000,
        insurance: 2000,
        councilRates: 2000,
        strataFees: 0,
        propertyMgmtFees: 4500,
        utilities: 0,
        otherExpenses: 0,
      }, 2024),
    ];

    const agg = aggregateKPIs(props, 2024);

    // p1 NOI: 36000 - (2000+1000+0+0+2700+0+0) = 30300
    // p2 NOI: 60000 - (3000+2000+2000+0+4500+0+0) = 48500
    expect(agg.noi).toBe(78800);
  });

  it("correctly aggregates loan balances when present", () => {
    const props = [
      makePropData("p1", "Prop 1", { loanBalance: 450000 }, 2024),
      makePropData("p2", "Prop 2", { loanBalance: 820000 }, 2024),
    ];

    const agg = aggregateKPIs(props, 2024);

    expect(agg.totalLoanBalance).toBe(1270000);
  });

  it("omits loan balance aggregation when no data", () => {
    const props = [
      makePropData("p1", "Prop 1", { loanBalance: null }, 2024),
      makePropData("p2", "Prop 2", { loanBalance: null }, 2024),
    ];

    const agg = aggregateKPIs(props, 2024);

    expect(agg.totalLoanBalance).toBeNull();
    expect(agg.avgLvr).toBeNull();
  });

  it("includes all properties in breakdown even missing ones", () => {
    const props = [
      makePropData("p1", "Prop 1", { rentIncome: 36000 }, 2024),
      makePropData("p2", "Prop 2", null, 2024),
      makePropData("p3", "Prop 3", { rentIncome: 48000 }, 2024),
    ];

    const agg = aggregateKPIs(props, 2024);

    expect(agg.propertyBreakdown).toHaveLength(3);
    expect(agg.propertyBreakdown.find((b) => b.propertyId === "p2")?.hasSnapshot).toBe(false);
  });
});

// ─── Test 2: Yields for combined portfolio ────────────────────────────────────

describe("portfolio yield calculation", () => {
  it("calculates combined gross yield from total rent / total reference value", () => {
    const props = [
      makePropData("p1", "Prop 1", { rentIncome: 48000 }, 2024, 960000),
      makePropData("p2", "Prop 2", { rentIncome: 60000 }, 2024, 1200000),
    ];

    const agg = aggregateKPIs(props, 2024);

    // total rent = 108000, total ref = 2160000
    // gross yield = 108000 / 2160000 = 0.05
    expect(agg.grossYield).toBeCloseTo(0.05, 4);
  });
});

// ─── Test 3: buildYearlyTrend ─────────────────────────────────────────────────

describe("buildYearlyTrend", () => {
  it("builds correct trend for multiple years", () => {
    const props = [
      {
        property: {
          id: "p1",
          name: "Prop 1",
          address: null,
          tags: [],
          purchaseDate: null,
          purchasePrice: 800000,
          ownershipPct: 100,
          isActive: true,
          valuations: [],
        },
        snapshot: {
          id: "s1",
          propertyId: "p1",
          year: 2023,
          rentIncome: 36000,
          otherIncome: 0,
          maintenance: 2000,
          insurance: 1000,
          councilRates: 1000,
          strataFees: 0,
          propertyMgmtFees: 2700,
          utilities: 0,
          otherExpenses: 0,
          interestPaid: 30000,
          principalPaid: 8000,
          capex: 0,
          loanBalance: null,
          notes: null,
        } as YearlySnapshotData,
      },
    ];

    const trend = buildYearlyTrend(props, [2022, 2023, 2024]);

    expect(trend).toHaveLength(3);
    const y2023 = trend.find((t) => t.year === 2023);
    expect(y2023?.grossIncome).toBe(36000);
    expect(y2023?.noi).toBe(36000 - (2000 + 1000 + 1000 + 2700)); // 29300
  });
});
