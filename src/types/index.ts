// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface PropertySummary {
  id: string;
  name: string;
  address: string | null;
  tags: string[];
  purchaseDate: Date | null;
  purchasePrice: number | null;
  ownershipPct: number;
  isActive: boolean;
}

export interface YearlySnapshotData {
  id: string;
  propertyId: string;
  year: number;

  // Income
  rentIncome: number | null;
  otherIncome: number | null;

  // Opex
  maintenance: number | null;
  insurance: number | null;
  councilRates: number | null;
  strataFees: number | null;
  propertyMgmtFees: number | null;
  utilities: number | null;
  otherExpenses: number | null;

  // Debt service
  interestPaid: number | null;
  principalPaid: number | null;

  // Capex
  capex: number | null;

  // Optional loan balance for LVR
  loanBalance: number | null;

  notes: string | null;
}

// ─── KPI Types ────────────────────────────────────────────────────────────────

export interface PropertyKPIs {
  // Income
  grossIncome: number;
  rentIncome: number;
  otherIncome: number;

  // Expenses
  totalOpex: number;          // operating expenses (excl. interest, principal, capex)
  totalExpenses: number;      // opex + interest
  totalExpensesWithPrincipal: number; // opex + interest + principal

  // Profit measures
  noi: number;                // Net Operating Income = grossIncome - totalOpex
  cashflowPrePrincipal: number; // grossIncome - totalOpex - interest
  cashflowPostPrincipal: number; // grossIncome - totalOpex - interest - principal

  // Yields (null if no valuation or purchase price)
  grossYield: number | null;      // rent / reference value
  netYield: number | null;        // noi / reference value
  referenceValue: number | null;  // purchase price or latest valuation

  // Debt
  loanBalance: number | null;
  equity: number | null;          // referenceValue - loanBalance
  lvr: number | null;             // loanBalance / referenceValue

  // Capex
  capex: number;

  // Ownership-adjusted (multiply by ownershipPct / 100)
  myShareGrossIncome: number;
  myShareNoi: number;
  myShareCashflowPrePrincipal: number;
  myShareCashflowPostPrincipal: number;
}

export interface SnapshotWithKPIs extends YearlySnapshotData {
  kpis: PropertyKPIs;
}

export interface YoYDelta {
  metric: string;
  current: number | null;
  previous: number | null;
  delta: number | null;          // absolute
  deltaPct: number | null;       // percentage
  isLarge: boolean;              // >20% change
}

// ─── Portfolio / Aggregation ──────────────────────────────────────────────────

export interface AggregatedKPIs {
  propertyCount: number;
  year: number;

  grossIncome: number;
  totalOpex: number;
  totalExpenses: number;
  noi: number;
  cashflowPrePrincipal: number;
  cashflowPostPrincipal: number;
  capex: number;

  totalReferenceValue: number | null;
  totalLoanBalance: number | null;
  totalEquity: number | null;
  avgLvr: number | null;

  grossYield: number | null;
  netYield: number | null;

  // Per-property breakdown
  propertyBreakdown: Array<{
    propertyId: string;
    propertyName: string;
    kpis: PropertyKPIs;
    hasSnapshot: boolean;
  }>;

  missingSnapshots: string[]; // property ids with no snapshot for this year
}

// ─── Wizard Types ─────────────────────────────────────────────────────────────

export interface WizardFormData {
  propertyId: string;
  year: number;

  // Step 2: Income
  rentIncome: number;
  otherIncome: number;

  // Step 3: Expenses
  maintenance: number;
  insurance: number;
  councilRates: number;
  strataFees: number;
  propertyMgmtFees: number;
  utilities: number;
  otherExpenses: number;
  capex: number;

  // Step 4: Loans
  interestPaid: number;
  principalPaid: number;
  loanBalance: number;

  // Step 5
  notes: string;
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export interface CsvImportRow {
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
}

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  created: number;
  updated: number;
}

// ─── Filter / View State ──────────────────────────────────────────────────────

export type OwnershipView = "gross" | "my-share";

export interface DashboardFilters {
  year: number;
  portfolioId?: string;
  propertyIds?: string[];
  tags?: string[];
  ownershipView: OwnershipView;
}
