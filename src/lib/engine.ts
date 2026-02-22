/**
 * Computed engine — derives all KPIs from raw event streams.
 *
 * Pure functions, no DB calls. Takes typed event arrays and an `asOf` date,
 * returns structured KPI objects.
 *
 * Designed to support future scenario engine: swap in hypothetical events,
 * call compute() with a future asOf date, get projected KPIs.
 */

// ─── Input types (match Prisma output after decimal coercion) ─────────────────

export interface EPurchase {
  settlementDate: Date
  purchasePrice: number
  deposit: number | null
  stampDuty: number | null
  legalFees: number | null
  buyersAgentFee: number | null
  loanAmount: number | null
}

export interface ELoan {
  effectiveDate: Date
  loanType: string          // "IO" | "PI"
  rateType: string          // "fixed" | "variable"
  annualRate: number        // 0.0574 = 5.74%
  repaymentAmount: number
  repaymentCadence: string  // "weekly" | "fortnightly" | "monthly"
  fixedExpiry: Date | null
  offsetBalance: number | null
  manualLoanBalance: number | null
  lender: string | null
}

export interface ETenancy {
  type: string              // "START" | "RENT_CHANGE" | "END"
  effectiveDate: Date
  weeklyRent: number | null
  leaseTermMonths: number | null
}

export interface ERecurringCost {
  effectiveDate: Date
  endDate: Date | null
  category: string
  feeType: string           // "fixed" | "pct_rent"
  amount: number            // weekly $ if fixed; fraction if pct_rent
  cadence: string           // "weekly" | "monthly" | "quarterly" | "annually"
}

export interface EOneOff {
  date: Date
  amount: number            // positive = income, negative = expense
  category: string
}

export interface EValuation {
  date: Date
  value: number
  source: string | null
}

export interface PropertyEvents {
  purchase: EPurchase | null
  loans: ELoan[]
  tenancies: ETenancy[]
  recurringCosts: ERecurringCost[]
  oneOffs: EOneOff[]
  valuations: EValuation[]
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface ComputedKPIs {
  asOf: Date

  // Acquisition
  purchasePrice: number
  acquisitionCosts: number  // stamp duty + legal + agent
  totalAcquisitionCost: number

  // Income (accrued to asOf)
  grossRent: number
  vacancyDays: number
  vacancyLoss: number

  // Recurring costs (accrued to asOf)
  recurringCostsByCategory: Record<string, number>
  totalRecurringCosts: number

  // One-off events (summed to asOf)
  oneOffIncome: number
  oneOffExpenses: number

  // Loan
  currentLoanBalance: number  // manual override if available, else computed
  loanBalanceSource: "manual" | "computed" | "none"
  totalInterestPaid: number   // accrued repayments × interest portion (estimated)
  currentRate: number | null
  currentLoanType: string | null
  fixedExpiry: Date | null

  // Cashflow
  noi: number               // grossRent - totalRecurringCosts
  netCashflow: number       // noi - totalInterestPaid + oneOffIncome + oneOffExpenses

  // Equity / value
  latestValuation: number | null
  latestValuationDate: Date | null
  equity: number | null
  lvr: number | null

  // Ownership-adjusted (by ownershipPct)
  ownershipPct: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Days between two dates (positive if b > a) */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Cadence → days per period */
function cadenceDays(cadence: string): number {
  switch (cadence) {
    case "weekly":      return 7
    case "fortnightly": return 14
    case "monthly":     return 365.25 / 12
    case "quarterly":   return 365.25 / 4
    case "annually":    return 365.25
    default:            return 365.25
  }
}

/** Clamp a date to [min, max] */
function clamp(d: Date, min: Date, max: Date): Date {
  if (d < min) return min
  if (d > max) return max
  return d
}

// ─── Sub-computations ─────────────────────────────────────────────────────────

/**
 * Compute gross rent accrued from tenancy events up to asOf.
 * Returns { grossRent, vacancyDays, vacancyLoss } from settlementDate.
 */
function computeRent(
  tenancies: ETenancy[],
  startDate: Date,
  asOf: Date
): { grossRent: number; vacancyDays: number; vacancyLoss: number } {
  if (tenancies.length === 0) return { grossRent: 0, vacancyDays: 0, vacancyLoss: 0 }

  // Build rent-per-day timeline from sorted events
  const events = [...tenancies]
    .filter(e => e.effectiveDate <= asOf)
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())

  let grossRent = 0
  let vacancyDays = 0
  let currentWeeklyRent: number | null = null
  let periodStart = startDate

  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    const periodEnd = clamp(ev.effectiveDate, startDate, asOf)
    const days = Math.max(0, daysBetween(periodStart, periodEnd))

    if (currentWeeklyRent !== null) {
      grossRent += currentWeeklyRent * (days / 7)
    } else {
      vacancyDays += days
    }

    periodStart = periodEnd

    if (ev.type === "END") {
      currentWeeklyRent = null
    } else {
      // START or RENT_CHANGE
      currentWeeklyRent = ev.weeklyRent ?? currentWeeklyRent
    }
  }

  // Final segment: from last event to asOf
  const remainingDays = Math.max(0, daysBetween(periodStart, asOf))
  if (currentWeeklyRent !== null) {
    grossRent += currentWeeklyRent * (remainingDays / 7)
  } else {
    vacancyDays += remainingDays
  }

  // Vacancy loss = what we would have earned at last known rent
  const lastKnownRent = [...events]
    .filter(e => e.type !== "END" && e.weeklyRent != null)
    .pop()?.weeklyRent ?? 0
  const vacancyLoss = lastKnownRent * (vacancyDays / 7)

  return { grossRent, vacancyDays, vacancyLoss }
}

/**
 * Compute recurring costs accrued from each RecurringCostEvent up to asOf.
 * pct_rent costs need current weekly rent at each point in time.
 */
function computeRecurringCosts(
  costs: ERecurringCost[],
  tenancies: ETenancy[],
  startDate: Date,
  asOf: Date
): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const cost of costs) {
    if (cost.effectiveDate > asOf) continue

    const costStart = clamp(cost.effectiveDate, startDate, asOf)
    const costEnd = cost.endDate ? clamp(cost.endDate, startDate, asOf) : asOf
    if (costStart >= costEnd) continue

    const days = daysBetween(costStart, costEnd)
    let amount = 0

    if (cost.feeType === "fixed") {
      // Convert cadence amount to daily rate
      const dailyRate = cost.amount / cadenceDays(cost.cadence)
      amount = dailyRate * days
    } else if (cost.feeType === "pct_rent") {
      // Need to compute rent over this period, then apply percentage
      const { grossRent } = computeRent(tenancies, costStart, costEnd)
      amount = grossRent * cost.amount
    }

    totals[cost.category] = (totals[cost.category] ?? 0) + amount
  }

  return totals
}

/**
 * Compute current loan balance.
 * Strategy:
 * 1. If the most recent LoanEvent (up to asOf) has manualLoanBalance set → use it
 * 2. Otherwise estimate: take loanAmount from PurchaseEvent, subtract
 *    principal component of repayments (estimated as 0 for IO, or
 *    (repayment - interest portion) for PI) for each loan period.
 * Returns { balance, source }
 */
function computeLoanBalance(
  purchase: EPurchase | null,
  loans: ELoan[],
  asOf: Date
): { balance: number; source: "manual" | "computed" | "none"; rate: number | null; loanType: string | null; fixedExpiry: Date | null } {
  const activeLoanEvents = loans
    .filter(e => e.effectiveDate <= asOf)
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())

  if (activeLoanEvents.length === 0) {
    return { balance: purchase?.loanAmount ?? 0, source: "none", rate: null, loanType: null, fixedExpiry: null }
  }

  const latestLoan = activeLoanEvents[activeLoanEvents.length - 1]

  // Manual override takes precedence
  if (latestLoan.manualLoanBalance != null) {
    return {
      balance: latestLoan.manualLoanBalance,
      source: "manual",
      rate: latestLoan.annualRate,
      loanType: latestLoan.loanType,
      fixedExpiry: latestLoan.fixedExpiry,
    }
  }

  // Compute: walk through each loan period
  let balance = purchase?.loanAmount ?? 0

  for (let i = 0; i < activeLoanEvents.length; i++) {
    const loan = activeLoanEvents[i]
    const periodStart = loan.effectiveDate
    const periodEnd = i + 1 < activeLoanEvents.length
      ? activeLoanEvents[i + 1].effectiveDate
      : asOf
    if (periodEnd <= periodStart) continue

    const days = daysBetween(periodStart, clamp(periodEnd, periodStart, asOf))
    const periodsElapsed = days / cadenceDays(loan.repaymentCadence)

    if (loan.loanType === "IO") {
      // Interest only — balance doesn't change
    } else {
      // PI — estimate principal component
      // Monthly interest = balance × annualRate / 12
      // Principal = repayment - interest (simplified, not amortisation schedule)
      const periodsPerYear = 365.25 / cadenceDays(loan.repaymentCadence)
      const ratePerPeriod = loan.annualRate / periodsPerYear
      // Approximate principal reduction per period
      const interestPerPeriod = balance * ratePerPeriod
      const principalPerPeriod = Math.max(0, loan.repaymentAmount - interestPerPeriod)
      balance = Math.max(0, balance - principalPerPeriod * periodsElapsed)
    }
  }

  return {
    balance,
    source: "computed",
    rate: latestLoan.annualRate,
    loanType: latestLoan.loanType,
    fixedExpiry: latestLoan.fixedExpiry,
  }
}

/**
 * Estimate total interest paid up to asOf from loan events.
 */
function computeInterestPaid(
  purchase: EPurchase | null,
  loans: ELoan[],
  asOf: Date
): number {
  const activeLoanEvents = loans
    .filter(e => e.effectiveDate <= asOf)
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())

  if (activeLoanEvents.length === 0) return 0

  let totalInterest = 0
  let balance = purchase?.loanAmount ?? 0

  for (let i = 0; i < activeLoanEvents.length; i++) {
    const loan = activeLoanEvents[i]
    const periodStart = loan.effectiveDate
    const periodEnd = i + 1 < activeLoanEvents.length
      ? activeLoanEvents[i + 1].effectiveDate
      : asOf
    if (periodEnd <= periodStart) continue

    const days = daysBetween(periodStart, clamp(periodEnd, periodStart, asOf))
    const periodsElapsed = days / cadenceDays(loan.repaymentCadence)
    const periodsPerYear = 365.25 / cadenceDays(loan.repaymentCadence)
    const ratePerPeriod = loan.annualRate / periodsPerYear

    if (loan.loanType === "IO") {
      totalInterest += balance * ratePerPeriod * periodsElapsed
    } else {
      // PI: approximate
      const interestPerPeriod = balance * ratePerPeriod
      const principalPerPeriod = Math.max(0, loan.repaymentAmount - interestPerPeriod)
      totalInterest += interestPerPeriod * periodsElapsed
      balance = Math.max(0, balance - principalPerPeriod * periodsElapsed)
    }
  }

  return totalInterest
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeKPIs(
  events: PropertyEvents,
  ownershipPct: number,
  asOf: Date = new Date()
): ComputedKPIs {
  const { purchase, loans, tenancies, recurringCosts, oneOffs, valuations } = events

  const startDate = purchase?.settlementDate ?? asOf

  // Rent
  const { grossRent, vacancyDays, vacancyLoss } = computeRent(tenancies, startDate, asOf)

  // Recurring costs
  const recurringCostsByCategory = computeRecurringCosts(recurringCosts, tenancies, startDate, asOf)
  const totalRecurringCosts = Object.values(recurringCostsByCategory).reduce((s, v) => s + v, 0)

  // One-off events up to asOf
  const relevantOneOffs = oneOffs.filter(e => e.date <= asOf)
  const oneOffIncome = relevantOneOffs.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const oneOffExpenses = relevantOneOffs.filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0)

  // Loan
  const { balance: currentLoanBalance, source: loanBalanceSource, rate: currentRate, loanType: currentLoanType, fixedExpiry } =
    computeLoanBalance(purchase, loans, asOf)
  const totalInterestPaid = computeInterestPaid(purchase, loans, asOf)

  // Cashflow
  const noi = grossRent - totalRecurringCosts
  const netCashflow = noi - totalInterestPaid + oneOffIncome + oneOffExpenses

  // Valuation
  const pastValuations = valuations
    .filter(v => v.date <= asOf)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
  const latestValuation = pastValuations[0]?.value ?? null
  const latestValuationDate = pastValuations[0]?.date ?? null

  // Equity
  const equity = latestValuation != null ? latestValuation - currentLoanBalance : null
  const lvr = latestValuation != null && latestValuation > 0
    ? currentLoanBalance / latestValuation
    : null

  // Acquisition costs
  const acquisitionCosts =
    (purchase?.stampDuty ?? 0) +
    (purchase?.legalFees ?? 0) +
    (purchase?.buyersAgentFee ?? 0)
  const totalAcquisitionCost = (purchase?.purchasePrice ?? 0) + acquisitionCosts

  return {
    asOf,
    purchasePrice: purchase?.purchasePrice ?? 0,
    acquisitionCosts,
    totalAcquisitionCost,
    grossRent,
    vacancyDays,
    vacancyLoss,
    recurringCostsByCategory,
    totalRecurringCosts,
    oneOffIncome,
    oneOffExpenses,
    currentLoanBalance,
    loanBalanceSource,
    totalInterestPaid,
    currentRate,
    currentLoanType,
    fixedExpiry,
    noi,
    netCashflow,
    latestValuation,
    latestValuationDate,
    equity,
    lvr,
    ownershipPct,
  }
}

/**
 * Compute annualised KPIs for a specific date range (e.g. FY2025).
 * Used for the legacy yearly view and tax summaries.
 */
export function computeForPeriod(
  events: PropertyEvents,
  ownershipPct: number,
  from: Date,
  to: Date
): {
  grossRent: number
  totalRecurringCosts: number
  recurringCostsByCategory: Record<string, number>
  oneOffIncome: number
  oneOffExpenses: number
  totalInterestPaid: number
  noi: number
  netCashflow: number
} {
  const { tenancies, recurringCosts, oneOffs, purchase, loans } = events

  const { grossRent } = computeRent(tenancies, from, to)
  const recurringCostsByCategory = computeRecurringCosts(recurringCosts, tenancies, from, to)
  const totalRecurringCosts = Object.values(recurringCostsByCategory).reduce((s, v) => s + v, 0)

  const periodOneOffs = oneOffs.filter(e => e.date >= from && e.date <= to)
  const oneOffIncome = periodOneOffs.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const oneOffExpenses = periodOneOffs.filter(e => e.amount < 0).reduce((s, e) => s + e.amount, 0)

  // Interest paid in period = computeInterestPaid(to) - computeInterestPaid(from-1day)
  const interestToEnd = computeInterestPaid(purchase, loans, to)
  const interestToStart = computeInterestPaid(purchase, loans, from)
  const totalInterestPaid = Math.max(0, interestToEnd - interestToStart)

  const noi = grossRent - totalRecurringCosts
  const netCashflow = noi - totalInterestPaid + oneOffIncome + oneOffExpenses

  return { grossRent, totalRecurringCosts, recurringCostsByCategory, oneOffIncome, oneOffExpenses, totalInterestPaid, noi, netCashflow }
}

// ─── Forecast engine ──────────────────────────────────────────────────────────

/** A single appreciation period segment: grow at `rate` for `years` years. */
export interface AppreciationPeriod {
  years: number   // duration of this segment (> 0)
  rate: number    // annual appreciation rate for this segment (e.g. 0.07 = 7%)
}

export interface ForecastPoint {
  year: number             // calendar year
  yearsFromNow: number
  projectedValue: number
  loanBalance: number
  equity: number
  lvr: number | null
  /** Estimated annual gross rent for that year (held flat at current run-rate) */
  annualGrossRent: number
  /** Estimated annual total recurring costs (held flat) */
  annualRecurringCosts: number
  /** Estimated annual interest (from projected loan balance) */
  annualInterest: number
  annualNetCashflow: number
  cumulativeCashflow: number    // sum of annualNetCashflow from asOf to this year
  /**
   * Equity gain from today to this year, measured against the true cash-in
   * basis: (deposit + acquisition costs). A negative value means you haven't
   * yet recovered stamp duty / legal / agent fees.
   */
  cumulativeEquityGain: number
  /**
   * Cumulative ROI: (equity gain + cumulative cashflow) / totalAcquisitionCost.
   * Will keep growing over time — use annualisedRoi for year-on-year comparison.
   */
  roi: number
  /**
   * Annualised ROI (CAGR of total return):
   * (1 + roi)^(1/years) - 1
   * Comparable across different time horizons.
   */
  annualisedRoi: number
  /** CAGR of property value from asOf */
  valueCagr: number
}

/**
 * Project property performance forward in annual steps.
 *
 * Valuation is re-anchored to the latest valuation event (if any), then
 * grows according to the provided appreciation schedule. Rent and recurring
 * costs are held at their current run-rate (conservative). Loan balance is
 * projected via the existing computeLoanBalance logic stepped forward year
 * by year.
 *
 * @param events          - all property events
 * @param ownershipPct    - ownership percentage (0-100)
 * @param appreciationRate - DEPRECATED single flat rate; ignored when `periods` is supplied
 * @param asOf            - projection start date (today)
 * @param years           - how many annual steps to project (e.g. [1,3,5,10])
 * @param periods         - optional multi-period schedule; overrides `appreciationRate`
 */
export function computeForecast(
  events: PropertyEvents,
  ownershipPct: number,
  appreciationRate: number,
  asOf: Date,
  years: number[],
  periods?: AppreciationPeriod[]
): ForecastPoint[] {
  const { purchase, loans, tenancies, recurringCosts, valuations } = events

  // ── Anchor value ──────────────────────────────────────────────────────────
  // Use the latest valuation event ≤ asOf, anchored at its date.
  // If no valuation exists, anchor at purchase price on settlement date.
  const pastValuations = valuations
    .filter(v => v.date <= asOf)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const anchorValue = pastValuations[0]?.value ?? purchase?.purchasePrice ?? 0
  const anchorDate = pastValuations[0]?.date ?? purchase?.settlementDate ?? asOf

  // ── Current run-rate cashflow ─────────────────────────────────────────────
  // Annualise by looking at the last 365 days up to asOf (or from settlement)
  const runRateStart = new Date(asOf)
  runRateStart.setFullYear(runRateStart.getFullYear() - 1)
  const effectiveStart = purchase?.settlementDate != null && purchase.settlementDate > runRateStart
    ? purchase.settlementDate
    : runRateStart
  const runRateDays = daysBetween(effectiveStart, asOf)
  const annualisationFactor = runRateDays > 0 ? 365.25 / runRateDays : 1

  const { grossRent: rrGrossRent } = computeRent(tenancies, effectiveStart, asOf)
  const rrRecurringByCategory = computeRecurringCosts(recurringCosts, tenancies, effectiveStart, asOf)
  const rrRecurringTotal = Object.values(rrRecurringByCategory).reduce((s, v) => s + v, 0)

  const annualGrossRent = rrGrossRent * annualisationFactor
  const annualRecurringCosts = rrRecurringTotal * annualisationFactor

  // ── Current equity (base for cumulative gain) ─────────────────────────────
  const { balance: currentLoanBalance } = computeLoanBalance(purchase, loans, asOf)
  const currentEquity = anchorValue - currentLoanBalance

  // ── Acquisition cost (denominator for ROI, and sunk-cost basis for equity gain) ──
  const acquisitionCosts =
    (purchase?.stampDuty ?? 0) +
    (purchase?.legalFees ?? 0) +
    (purchase?.buyersAgentFee ?? 0)
  const totalAcquisitionCost = Math.max(1, (purchase?.purchasePrice ?? 0) + acquisitionCosts)

  // The "true cash in" basis for equity gain: the equity you'd have if you'd
  // recovered every dollar of acquisition cost. On day 0 your property is worth
  // purchasePrice but you've spent purchasePrice + acquisitionCosts, so equity
  // gain starts negative by acquisitionCosts until the property appreciates enough.
  const equityGainBasis = currentEquity - acquisitionCosts

  // ── Project each year ─────────────────────────────────────────────────────
  // Build a helper: given yearsFromNow (fractional ok), return the projected value
  // accounting for multi-period appreciation schedule.
  function projectValue(yearsFromAnchor: number): number {
    if (periods && periods.length > 0) {
      // Walk through each segment, applying compound growth
      let value = anchorValue
      let remaining = yearsFromAnchor
      for (const seg of periods) {
        if (remaining <= 0) break
        const segYears = Math.min(remaining, seg.years)
        value *= Math.pow(1 + seg.rate, segYears)
        remaining -= segYears
      }
      // If we've exhausted the schedule but still have years left,
      // apply the last segment's rate for the remainder
      if (remaining > 0) {
        const lastRate = periods[periods.length - 1].rate
        value *= Math.pow(1 + lastRate, remaining)
      }
      return value
    }
    // Legacy flat rate
    return anchorValue * Math.pow(1 + appreciationRate, yearsFromAnchor)
  }

  let cumulativeCashflow = 0
  const results: ForecastPoint[] = []

  for (const y of [...years].sort((a, b) => a - b)) {
    const yearsFromAnchor = (y * 365.25 + daysBetween(anchorDate, asOf)) / 365.25
    const projectedValue = projectValue(yearsFromAnchor)

    // Loan balance: step the loan forward y years from asOf
    const futureDate = new Date(asOf)
    futureDate.setFullYear(futureDate.getFullYear() + y)
    const { balance: futureLoanBalance, rate: futureRate } = computeLoanBalance(purchase, loans, futureDate)

    const equity = projectedValue - futureLoanBalance
    const lvr = projectedValue > 0 ? futureLoanBalance / projectedValue : null

    // Annual interest at that future point
    const annualInterest = futureRate != null
      ? futureLoanBalance * futureRate
      : annualGrossRent * 0  // fallback: 0 if no loan info

    const annualNetCashflow = annualGrossRent - annualRecurringCosts - annualInterest

    // Accumulate: each year from the previous checkpoint
    const prevY = results.length > 0 ? results[results.length - 1].yearsFromNow : 0
    const deltaYears = y - prevY
    cumulativeCashflow += annualNetCashflow * deltaYears

    const cumulativeEquityGain = equity - equityGainBasis

    // ROI = (equity gain + cumulative cashflow received) / total cost base
    const roi = (cumulativeEquityGain + cumulativeCashflow) / totalAcquisitionCost

    // Annualised ROI: CAGR of total return — comparable across horizons
    const annualisedRoi = y > 0
      ? Math.pow(Math.max(0, 1 + roi), 1 / y) - 1
      : roi

    // CAGR of value from asOf
    const valueCagr = y > 0
      ? Math.pow(projectedValue / Math.max(1, anchorValue), 1 / y) - 1
      : appreciationRate

    results.push({
      year: asOf.getFullYear() + y,
      yearsFromNow: y,
      projectedValue,
      loanBalance: futureLoanBalance,
      equity,
      lvr,
      annualGrossRent,
      annualRecurringCosts,
      annualInterest,
      annualNetCashflow,
      cumulativeCashflow,
      cumulativeEquityGain,
      roi,
      annualisedRoi,
      valueCagr,
    })
  }

  return results
}
