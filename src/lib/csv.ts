/**
 * CSV parsing and formatting utilities.
 * Uses PapaParse for robust CSV handling.
 */

import Papa from "papaparse";
import type { CsvImportRow, YearlySnapshotData } from "@/types";

// ─── Canonical CSV format ─────────────────────────────────────────────────────

export const CSV_HEADERS = [
  "property_name",
  "year",
  "rent",
  "other_income",
  "repairs",
  "insurance",
  "rates",
  "strata",
  "pm_fees",
  "utilities",
  "other_expenses",
  "interest_paid",
  "principal_paid",
  "capex",
  "notes",
] as const;

export type CsvHeader = (typeof CSV_HEADERS)[number];

// ─── Parse ────────────────────────────────────────────────────────────────────

export interface ParsedCsvResult {
  rows: CsvImportRow[];
  errors: Array<{ row: number; message: string }>;
}

function toNum(val: unknown): number {
  const n = Number(String(val).replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function parseCsvText(text: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const rows: CsvImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  result.data.forEach((raw, i) => {
    const rowNum = i + 2; // 1-indexed + header row

    const propertyName = String(raw["property_name"] ?? "").trim();
    if (!propertyName) {
      errors.push({ row: rowNum, message: "Missing property_name" });
      return;
    }

    const year = parseInt(raw["year"] ?? "", 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      errors.push({ row: rowNum, message: `Invalid year: ${raw["year"]}` });
      return;
    }

    rows.push({
      property_name: propertyName,
      year,
      rent: toNum(raw["rent"]),
      other_income: toNum(raw["other_income"]),
      repairs: toNum(raw["repairs"]),
      insurance: toNum(raw["insurance"]),
      rates: toNum(raw["rates"]),
      strata: toNum(raw["strata"]),
      pm_fees: toNum(raw["pm_fees"]),
      utilities: toNum(raw["utilities"]),
      other_expenses: toNum(raw["other_expenses"]),
      interest_paid: toNum(raw["interest_paid"]),
      principal_paid: toNum(raw["principal_paid"]),
      capex: toNum(raw["capex"]),
      notes: String(raw["notes"] ?? "").trim(),
    });
  });

  return { rows, errors };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportRow {
  property_name: string;
  year: number;
  rent: number;
  other_income: number;
  repairs: number;
  insurance: number;
  rates: number;
  strata: number;
  pm_fees: number;
  utilities: number;
  other_expenses: number;
  interest_paid: number;
  principal_paid: number;
  capex: number;
  notes: string;
  // Computed
  gross_income: number;
  total_opex: number;
  noi: number;
  cashflow_pre_principal: number;
  cashflow_post_principal: number;
}

export function toCsvString(rows: ExportRow[]): string {
  return Papa.unparse(rows, { header: true });
}

export function snapshotToExportRow(
  propertyName: string,
  snap: YearlySnapshotData,
  noi: number,
  cashflowPre: number,
  cashflowPost: number
): ExportRow {
  const n = (v: number | null) => v ?? 0;
  return {
    property_name: propertyName,
    year: snap.year,
    rent: n(snap.rentIncome),
    other_income: n(snap.otherIncome),
    repairs: n(snap.maintenance),
    insurance: n(snap.insurance),
    rates: n(snap.councilRates),
    strata: n(snap.strataFees),
    pm_fees: n(snap.propertyMgmtFees),
    utilities: n(snap.utilities),
    other_expenses: n(snap.otherExpenses),
    interest_paid: n(snap.interestPaid),
    principal_paid: n(snap.principalPaid),
    capex: n(snap.capex),
    notes: snap.notes ?? "",
    gross_income: n(snap.rentIncome) + n(snap.otherIncome),
    total_opex:
      n(snap.maintenance) +
      n(snap.insurance) +
      n(snap.councilRates) +
      n(snap.strataFees) +
      n(snap.propertyMgmtFees) +
      n(snap.utilities) +
      n(snap.otherExpenses),
    noi,
    cashflow_pre_principal: cashflowPre,
    cashflow_post_principal: cashflowPost,
  };
}
