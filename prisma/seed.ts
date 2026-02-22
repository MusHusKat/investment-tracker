import { PrismaClient } from "@prisma/client";
import { hash } from "crypto";

const prisma = new PrismaClient();

function simpleHash(password: string): string {
  return hash("sha256", password);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── User ──────────────────────────────────────────────────────────────────

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: simpleHash("devpassword"),
    },
  });

  console.log(`✅ User: ${user.email}`);

  // ─── Properties ───────────────────────────────────────────────────────────

  const propA = await prisma.property.upsert({
    where: { id: "prop_frenchville" },
    update: {
      name: "193 Frenchville Rd",
      address: "193 Frenchville Road, Frenchville QLD 4701",
      tags: ["house", "queensland", "rockhampton"],
      purchaseDate: new Date("2024-11-01"),
      purchasePrice: 555000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($13,875). Stamp duty $18,000. I/O 5 yrs @ 5.74%. Offset $150k.",
    },
    create: {
      id: "prop_frenchville",
      userId: user.id,
      name: "193 Frenchville Rd",
      address: "193 Frenchville Road, Frenchville QLD 4701",
      tags: ["house", "queensland", "rockhampton"],
      purchaseDate: new Date("2024-11-01"),
      purchasePrice: 555000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($13,875). Stamp duty $18,000. I/O 5 yrs @ 5.74%. Offset $150k.",
    },
  });

  const propB = await prisma.property.upsert({
    where: { id: "prop_tuart_hill" },
    update: {
      name: "22/208 North Beach Dr",
      address: "22/208 North Beach Drive, Tuart Hill WA 6060",
      tags: ["villa", "western-australia", "tuart-hill"],
      purchaseDate: new Date("2025-02-01"),
      purchasePrice: 530000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($13,250). Stamp duty $19,190. I/O 3 yrs @ 4.99%. No offset.",
    },
    create: {
      id: "prop_tuart_hill",
      userId: user.id,
      name: "22/208 North Beach Dr",
      address: "22/208 North Beach Drive, Tuart Hill WA 6060",
      tags: ["villa", "western-australia", "tuart-hill"],
      purchaseDate: new Date("2025-02-01"),
      purchasePrice: 530000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($13,250). Stamp duty $19,190. I/O 3 yrs @ 4.99%. No offset.",
    },
  });

  const propC = await prisma.property.upsert({
    where: { id: "prop_chelsea" },
    update: {
      name: "6/1 Golden Avenue",
      address: "6/1 Golden Avenue, Chelsea VIC 3196",
      tags: ["villa", "victoria", "chelsea"],
      purchaseDate: new Date("2026-02-01"),
      purchasePrice: 700000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($17,500). Stamp duty $37,070. I/O 3 yrs @ 5.89%. No offset.",
    },
    create: {
      id: "prop_chelsea",
      userId: user.id,
      name: "6/1 Golden Avenue",
      address: "6/1 Golden Avenue, Chelsea VIC 3196",
      tags: ["villa", "victoria", "chelsea"],
      purchaseDate: new Date("2026-02-01"),
      purchasePrice: 700000,
      ownershipPct: 100,
      isActive: true,
      notes: "Buyers agent 2.5% ($17,500). Stamp duty $37,070. I/O 3 yrs @ 5.89%. No offset.",
    },
  });

  console.log(`✅ Properties: ${[propA, propB, propC].map((p) => p.name).join(", ")}`);

  // ─── Legacy Yearly Snapshots (kept for backward compat) ───────────────────

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propA.id, year: 2025 } },
    update: {},
    create: {
      propertyId: propA.id, year: 2025,
      rentIncome: 22052, maintenance: 2500, insurance: 2042,
      councilRates: 0, strataFees: 1500, propertyMgmtFees: 4637.3,
      utilities: 2500, interestPaid: 11648.12, principalPaid: 1732.88,
      loanBalance: 431167.12,
      notes: "Partial year (purchased Nov 2024). Est. value $640k.",
    },
  });

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propB.id, year: 2025 } },
    update: {},
    create: {
      propertyId: propB.id, year: 2025,
      rentIncome: 10980, maintenance: 2500, insurance: 0,
      councilRates: 2500, strataFees: 3000, propertyMgmtFees: 4552.6,
      utilities: 325, interestPaid: 10022.29, principalPaid: 349.71,
      loanBalance: 424000,
      notes: "Partial year (purchased Feb 2025). Est. value $600k.",
    },
  });

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propC.id, year: 2026 } },
    update: {},
    create: {
      propertyId: propC.id, year: 2026,
      rentIncome: 29638, maintenance: 3000, insurance: 500,
      councilRates: 2420, strataFees: 1585, propertyMgmtFees: 12338.8,
      utilities: 975, interestPaid: 32984, principalPaid: 0,
      loanBalance: 560000,
      notes: "Projected Year 1 (purchased Feb 2026). Est. value $749k.",
    },
  });

  // ─── Legacy Loans ─────────────────────────────────────────────────────────

  await prisma.loan.createMany({
    skipDuplicates: true,
    data: [
      { propertyId: propA.id, lender: "Unknown", originalAmount: 432900, interestRate: 0.0574, loanType: "interest-only", startDate: new Date("2024-11-01") },
      { propertyId: propB.id, lender: "Unknown", originalAmount: 424000, interestRate: 0.0499, loanType: "interest-only", startDate: new Date("2025-02-01") },
      { propertyId: propC.id, lender: "Unknown", originalAmount: 560000, interestRate: 0.0589, loanType: "interest-only", startDate: new Date("2026-02-01") },
    ],
  });

  // ─── Legacy Valuations ────────────────────────────────────────────────────

  await prisma.valuation.createMany({
    skipDuplicates: true,
    data: [
      { propertyId: propA.id, valuedAt: new Date("2025-12-31"), value: 640000, source: "estimate", notes: "Year 1 estimate" },
      { propertyId: propB.id, valuedAt: new Date("2025-12-31"), value: 600000, source: "estimate", notes: "Year 1 estimate" },
      { propertyId: propC.id, valuedAt: new Date("2026-12-31"), value: 749000, source: "estimate", notes: "Year 1 projection" },
    ],
  });

  console.log(`✅ Legacy snapshots/loans/valuations`);

  // ─── Event Model: Property A — 193 Frenchville Rd ─────────────────────────

  await prisma.purchaseEvent.upsert({
    where: { propertyId: propA.id },
    update: {},
    create: {
      propertyId: propA.id,
      settlementDate: new Date("2024-11-01"),
      purchasePrice: 555000,
      deposit: 122100,          // ~22% deposit
      stampDuty: 18000,
      legalFees: 2000,
      buyersAgentFee: 13875,    // 2.5%
      loanAmount: 432900,
      notes: "I/O 5 yrs @ 5.74%. Offset $150k.",
    },
  });

  // Loan structure — IO @ 5.74%, repayment ~monthly
  await prisma.loanEvent.upsert({
    where: { id: "loan_a_initial" },
    update: {},
    create: {
      id: "loan_a_initial",
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0574,
      repaymentAmount: 2069.51,  // 432900 × 5.74% / 12
      repaymentCadence: "monthly",
      offsetBalance: 150000,
      manualLoanBalance: 431167.12,  // from Dec 2025 snapshot
      notes: "IO period 5 years from settlement",
    },
  });

  // Tenancy — started ~Nov 2024, weekly rent $424/wk = $22,052/yr
  await prisma.tenancyEvent.upsert({
    where: { id: "tenancy_a_start" },
    update: {},
    create: {
      id: "tenancy_a_start",
      propertyId: propA.id,
      type: "START",
      effectiveDate: new Date("2024-11-15"),
      weeklyRent: 424,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  // Recurring costs — management fee 8% of rent
  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_a_mgmt" },
    update: {},
    create: {
      id: "rc_a_mgmt",
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-15"),
      category: "MGMT_FEE",
      feeType: "pct_rent",
      amount: 0.08,
      cadence: "monthly",
      notes: "8% management fee",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_a_insurance" },
    update: {},
    create: {
      id: "rc_a_insurance",
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      category: "INSURANCE",
      feeType: "fixed",
      amount: 2042,
      cadence: "annually",
      notes: "Landlord insurance",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_a_strata" },
    update: {},
    create: {
      id: "rc_a_strata",
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      category: "STRATA",
      feeType: "fixed",
      amount: 1500,
      cadence: "annually",
      notes: "Body corp / strata",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_a_water" },
    update: {},
    create: {
      id: "rc_a_water",
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      category: "WATER",
      feeType: "fixed",
      amount: 2500,
      cadence: "annually",
      notes: "Water rates",
    },
  });

  // One-off: maintenance/repairs in 2025
  await prisma.oneOffEvent.upsert({
    where: { id: "oneoff_a_repairs_2025" },
    update: {},
    create: {
      id: "oneoff_a_repairs_2025",
      propertyId: propA.id,
      date: new Date("2025-06-30"),
      amount: -2500,
      category: "MAINTENANCE",
      notes: "General repairs Year 1",
    },
  });

  // Valuation event
  await prisma.valuationEvent.upsert({
    where: { id: "val_a_2025" },
    update: {},
    create: {
      id: "val_a_2025",
      propertyId: propA.id,
      date: new Date("2025-12-31"),
      value: 640000,
      source: "SELF",
      notes: "Year 1 estimate",
    },
  });

  // ─── Event Model: Property B — 22/208 North Beach Dr ──────────────────────

  await prisma.purchaseEvent.upsert({
    where: { propertyId: propB.id },
    update: {},
    create: {
      propertyId: propB.id,
      settlementDate: new Date("2025-02-01"),
      purchasePrice: 530000,
      deposit: 106000,
      stampDuty: 19190,
      legalFees: 2000,
      buyersAgentFee: 13250,
      loanAmount: 424000,
      notes: "I/O 3 yrs @ 4.99%.",
    },
  });

  await prisma.loanEvent.upsert({
    where: { id: "loan_b_initial" },
    update: {},
    create: {
      id: "loan_b_initial",
      propertyId: propB.id,
      effectiveDate: new Date("2025-02-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0499,
      repaymentAmount: 1763.33,  // 424000 × 4.99% / 12
      repaymentCadence: "monthly",
      manualLoanBalance: 424000,
      notes: "IO period 3 years from settlement",
    },
  });

  // Tenancy — started Feb 2025, $10,980/yr = ~$211/wk (partial year, say rented Mar 2025)
  await prisma.tenancyEvent.upsert({
    where: { id: "tenancy_b_start" },
    update: {},
    create: {
      id: "tenancy_b_start",
      propertyId: propB.id,
      type: "START",
      effectiveDate: new Date("2025-03-01"),
      weeklyRent: 420,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_b_mgmt" },
    update: {},
    create: {
      id: "rc_b_mgmt",
      propertyId: propB.id,
      effectiveDate: new Date("2025-03-01"),
      category: "MGMT_FEE",
      feeType: "pct_rent",
      amount: 0.0715,
      cadence: "monthly",
      notes: "7.15% management fee",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_b_strata" },
    update: {},
    create: {
      id: "rc_b_strata",
      propertyId: propB.id,
      effectiveDate: new Date("2025-02-01"),
      category: "STRATA",
      feeType: "fixed",
      amount: 3000,
      cadence: "annually",
      notes: "Strata levy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_b_council" },
    update: {},
    create: {
      id: "rc_b_council",
      propertyId: propB.id,
      effectiveDate: new Date("2025-02-01"),
      category: "COUNCIL",
      feeType: "fixed",
      amount: 2500,
      cadence: "annually",
      notes: "Council rates",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_b_water" },
    update: {},
    create: {
      id: "rc_b_water",
      propertyId: propB.id,
      effectiveDate: new Date("2025-02-01"),
      category: "WATER",
      feeType: "fixed",
      amount: 325,
      cadence: "annually",
      notes: "Land/water rates",
    },
  });

  await prisma.oneOffEvent.upsert({
    where: { id: "oneoff_b_repairs_2025" },
    update: {},
    create: {
      id: "oneoff_b_repairs_2025",
      propertyId: propB.id,
      date: new Date("2025-09-30"),
      amount: -2500,
      category: "MAINTENANCE",
      notes: "General repairs Year 1",
    },
  });

  await prisma.valuationEvent.upsert({
    where: { id: "val_b_2025" },
    update: {},
    create: {
      id: "val_b_2025",
      propertyId: propB.id,
      date: new Date("2025-12-31"),
      value: 600000,
      source: "SELF",
      notes: "Year 1 estimate",
    },
  });

  // ─── Event Model: Property C — 6/1 Golden Avenue ──────────────────────────

  await prisma.purchaseEvent.upsert({
    where: { propertyId: propC.id },
    update: {},
    create: {
      propertyId: propC.id,
      settlementDate: new Date("2026-02-01"),
      purchasePrice: 700000,
      deposit: 140000,
      stampDuty: 37070,
      legalFees: 2500,
      buyersAgentFee: 17500,
      loanAmount: 560000,
      notes: "I/O 3 yrs @ 5.89%.",
    },
  });

  await prisma.loanEvent.upsert({
    where: { id: "loan_c_initial" },
    update: {},
    create: {
      id: "loan_c_initial",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0589,
      repaymentAmount: 2747.33,  // 560000 × 5.89% / 12
      repaymentCadence: "monthly",
      manualLoanBalance: 560000,
      notes: "IO period 3 years from settlement",
    },
  });

  // Tenancy — started ~Feb 2026, $570/wk = $29,638/yr
  await prisma.tenancyEvent.upsert({
    where: { id: "tenancy_c_start" },
    update: {},
    create: {
      id: "tenancy_c_start",
      propertyId: propC.id,
      type: "START",
      effectiveDate: new Date("2026-02-15"),
      weeklyRent: 570,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_c_mgmt" },
    update: {},
    create: {
      id: "rc_c_mgmt",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-15"),
      category: "MGMT_FEE",
      feeType: "pct_rent",
      amount: 0.08,
      cadence: "monthly",
      notes: "8% management fee",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_c_insurance" },
    update: {},
    create: {
      id: "rc_c_insurance",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      category: "INSURANCE",
      feeType: "fixed",
      amount: 500,
      cadence: "annually",
      notes: "Landlord insurance",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_c_strata" },
    update: {},
    create: {
      id: "rc_c_strata",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      category: "STRATA",
      feeType: "fixed",
      amount: 1585,
      cadence: "annually",
      notes: "Strata levy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_c_council" },
    update: {},
    create: {
      id: "rc_c_council",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      category: "COUNCIL",
      feeType: "fixed",
      amount: 2420,
      cadence: "annually",
      notes: "Council rates",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: "rc_c_water" },
    update: {},
    create: {
      id: "rc_c_water",
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      category: "WATER",
      feeType: "fixed",
      amount: 975,
      cadence: "annually",
      notes: "Land/water rates",
    },
  });

  await prisma.valuationEvent.upsert({
    where: { id: "val_c_2026" },
    update: {},
    create: {
      id: "val_c_2026",
      propertyId: propC.id,
      date: new Date("2026-12-31"),
      value: 749000,
      source: "SELF",
      notes: "Year 1 projection",
    },
  });

  console.log(`✅ Event model: PurchaseEvents, LoanEvents, TenancyEvents, RecurringCosts, ValuationEvents`);

  // ─── Portfolio ────────────────────────────────────────────────────────────

  const portfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio_all" },
    update: { name: "All Properties" },
    create: {
      id: "portfolio_all",
      userId: user.id,
      name: "All Properties",
      description: "Full portfolio — A, B and C",
    },
  });

  await prisma.portfolioProperty.createMany({
    skipDuplicates: true,
    data: [
      { portfolioId: portfolio.id, propertyId: propA.id },
      { portfolioId: portfolio.id, propertyId: propB.id },
      { portfolioId: portfolio.id, propertyId: propC.id },
    ],
  });

  console.log(`✅ Portfolio: ${portfolio.name}`);
  console.log("\n🎉 Seed complete!");
  console.log("   Login: demo@example.com / devpassword");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
