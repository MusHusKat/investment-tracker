import { describe, it, expect } from "vitest";
import { parseCsvText, toCsvString, snapshotToExportRow } from "../src/lib/csv";
import type { YearlySnapshotData } from "../src/types";

const VALID_CSV = `property_name,year,rent,other_income,repairs,insurance,rates,strata,pm_fees,utilities,other_expenses,interest_paid,principal_paid,capex,notes
Sydney Unit,2024,48000,0,2000,1800,1600,4800,3600,0,500,52000,9000,0,Strong year
Melbourne House,2024,62400,1200,3200,2900,2500,0,4680,950,500,52000,9500,0,`;

const INVALID_CSV = `property_name,year,rent,other_income,repairs,insurance,rates,strata,pm_fees,utilities,other_expenses,interest_paid,principal_paid,capex,notes
,2024,48000,0,2000,1800,1600,4800,3600,0,500,52000,9000,0,Missing name
Sydney Unit,badyear,48000,0,2000,1800,1600,4800,3600,0,500,52000,9000,0,
Good Property,2023,36000,0,0,0,0,0,0,0,0,0,0,0,valid row`;

describe("parseCsvText", () => {
  it("parses valid rows correctly", () => {
    const { rows, errors } = parseCsvText(VALID_CSV);
    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(0);

    const row1 = rows[0];
    expect(row1.property_name).toBe("Sydney Unit");
    expect(row1.year).toBe(2024);
    expect(row1.rent).toBe(48000);
    expect(row1.interest_paid).toBe(52000);
    expect(row1.notes).toBe("Strong year");
  });

  it("reports errors for invalid rows without stopping", () => {
    const { rows, errors } = parseCsvText(INVALID_CSV);
    // Row 1: missing property_name → error
    // Row 2: bad year → error
    // Row 3: valid
    expect(errors).toHaveLength(2);
    expect(rows).toHaveLength(1);
    expect(rows[0].property_name).toBe("Good Property");
  });

  it("handles $-prefixed and comma-formatted numbers", () => {
    const csv = `property_name,year,rent,other_income,repairs,insurance,rates,strata,pm_fees,utilities,other_expenses,interest_paid,principal_paid,capex,notes
My Place,2024,"$48,000",0,0,0,0,0,0,0,0,0,0,0,`;
    const { rows } = parseCsvText(csv);
    expect(rows[0].rent).toBe(48000);
  });

  it("returns empty rows for empty CSV", () => {
    const { rows, errors } = parseCsvText("property_name,year\n");
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});

describe("toCsvString + snapshotToExportRow", () => {
  it("produces valid CSV output", () => {
    const snap: YearlySnapshotData = {
      id: "test",
      propertyId: "p1",
      year: 2024,
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 2000,
      insurance: 1800,
      councilRates: 1600,
      strataFees: 4800,
      propertyMgmtFees: 3600,
      utilities: 0,
      otherExpenses: 500,
      interestPaid: 52000,
      principalPaid: 9000,
      capex: 0,
      loanBalance: 820000,
      notes: "Test note",
    };

    const row = snapshotToExportRow(
      "Test Property",
      snap,
      34200,   // NOI
      -17800,  // cashflow pre
      -26800   // cashflow post
    );

    expect(row.property_name).toBe("Test Property");
    expect(row.year).toBe(2024);
    expect(row.rent).toBe(48000);
    expect(row.gross_income).toBe(48000);
    expect(row.total_opex).toBe(14300);
    expect(row.noi).toBe(34200);
    expect(row.cashflow_pre_principal).toBe(-17800);
    expect(row.cashflow_post_principal).toBe(-26800);

    const csvStr = toCsvString([row]);
    expect(csvStr).toContain("Test Property");
    expect(csvStr).toContain("2024");
    expect(csvStr).toContain("48000");
  });
});
