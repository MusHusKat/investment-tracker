/**
 * Seed production data for an existing user.
 *
 * Usage:
 *   pnpm db:seed-user <email>
 *
 * Example:
 *   pnpm db:seed-user mustafa.katha@gmail.com
 *
 * The user must already exist (created via pnpm db:add-user).
 * Safe to re-run — all upserts are idempotent.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: pnpm db:seed-user <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}. Create them first with pnpm db:add-user.`);
    process.exit(1);
  }

  console.log(`🌱 Seeding data for ${user.email}...`);

  // ─── Properties ───────────────────────────────────────────────────────────

  const propA = await prisma.property.upsert({
    where: { id: `prop_frenchville_${user.id}` },
    update: {},
    create: {
      id: `prop_frenchville_${user.id}`,
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
    where: { id: `prop_tuart_hill_${user.id}` },
    update: {},
    create: {
      id: `prop_tuart_hill_${user.id}`,
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
    where: { id: `prop_chelsea_${user.id}` },
    update: {},
    create: {
      id: `prop_chelsea_${user.id}`,
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

  // ─── Property A — 193 Frenchville Rd ──────────────────────────────────────

  await prisma.purchaseEvent.upsert({
    where: { propertyId: propA.id },
    update: {},
    create: {
      propertyId: propA.id,
      settlementDate: new Date("2024-11-01"),
      purchasePrice: 555000,
      deposit: 122100,
      stampDuty: 18000,
      legalFees: 2000,
      buyersAgentFee: 13875,
      loanAmount: 432900,
      notes: "I/O 5 yrs @ 5.74%. Offset $150k.",
    },
  });

  await prisma.loanEvent.upsert({
    where: { id: `loan_a_${user.id}` },
    update: {},
    create: {
      id: `loan_a_${user.id}`,
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0574,
      repaymentAmount: 2069.51,
      repaymentCadence: "monthly",
      offsetBalance: 150000,
      manualLoanBalance: 431167.12,
      notes: "IO period 5 years from settlement",
    },
  });

  await prisma.tenancyEvent.upsert({
    where: { id: `tenancy_a_${user.id}` },
    update: {},
    create: {
      id: `tenancy_a_${user.id}`,
      propertyId: propA.id,
      type: "START",
      effectiveDate: new Date("2024-11-15"),
      weeklyRent: 424,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: `rc_a_mgmt_${user.id}` },
    update: {},
    create: {
      id: `rc_a_mgmt_${user.id}`,
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
    where: { id: `rc_a_insurance_${user.id}` },
    update: {},
    create: {
      id: `rc_a_insurance_${user.id}`,
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
    where: { id: `rc_a_strata_${user.id}` },
    update: {},
    create: {
      id: `rc_a_strata_${user.id}`,
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
    where: { id: `rc_a_water_${user.id}` },
    update: {},
    create: {
      id: `rc_a_water_${user.id}`,
      propertyId: propA.id,
      effectiveDate: new Date("2024-11-01"),
      category: "WATER",
      feeType: "fixed",
      amount: 2500,
      cadence: "annually",
      notes: "Water rates",
    },
  });

  await prisma.oneOffEvent.upsert({
    where: { id: `oneoff_a_repairs_${user.id}` },
    update: {},
    create: {
      id: `oneoff_a_repairs_${user.id}`,
      propertyId: propA.id,
      date: new Date("2025-06-30"),
      amount: -2500,
      category: "MAINTENANCE",
      notes: "General repairs Year 1",
    },
  });

  await prisma.valuationEvent.upsert({
    where: { id: `val_a_${user.id}` },
    update: {},
    create: {
      id: `val_a_${user.id}`,
      propertyId: propA.id,
      date: new Date("2025-12-31"),
      value: 640000,
      source: "SELF",
      notes: "Year 1 estimate",
    },
  });

  // ─── Property B — 22/208 North Beach Dr ───────────────────────────────────

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
    where: { id: `loan_b_${user.id}` },
    update: {},
    create: {
      id: `loan_b_${user.id}`,
      propertyId: propB.id,
      effectiveDate: new Date("2025-02-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0499,
      repaymentAmount: 1763.33,
      repaymentCadence: "monthly",
      manualLoanBalance: 424000,
      notes: "IO period 3 years from settlement",
    },
  });

  await prisma.tenancyEvent.upsert({
    where: { id: `tenancy_b_${user.id}` },
    update: {},
    create: {
      id: `tenancy_b_${user.id}`,
      propertyId: propB.id,
      type: "START",
      effectiveDate: new Date("2025-03-01"),
      weeklyRent: 420,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: `rc_b_mgmt_${user.id}` },
    update: {},
    create: {
      id: `rc_b_mgmt_${user.id}`,
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
    where: { id: `rc_b_strata_${user.id}` },
    update: {},
    create: {
      id: `rc_b_strata_${user.id}`,
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
    where: { id: `rc_b_council_${user.id}` },
    update: {},
    create: {
      id: `rc_b_council_${user.id}`,
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
    where: { id: `rc_b_water_${user.id}` },
    update: {},
    create: {
      id: `rc_b_water_${user.id}`,
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
    where: { id: `oneoff_b_repairs_${user.id}` },
    update: {},
    create: {
      id: `oneoff_b_repairs_${user.id}`,
      propertyId: propB.id,
      date: new Date("2025-09-30"),
      amount: -2500,
      category: "MAINTENANCE",
      notes: "General repairs Year 1",
    },
  });

  await prisma.valuationEvent.upsert({
    where: { id: `val_b_${user.id}` },
    update: {},
    create: {
      id: `val_b_${user.id}`,
      propertyId: propB.id,
      date: new Date("2025-12-31"),
      value: 600000,
      source: "SELF",
      notes: "Year 1 estimate",
    },
  });

  // ─── Property C — 6/1 Golden Avenue ───────────────────────────────────────

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
    where: { id: `loan_c_${user.id}` },
    update: {},
    create: {
      id: `loan_c_${user.id}`,
      propertyId: propC.id,
      effectiveDate: new Date("2026-02-01"),
      lender: "Unknown",
      loanType: "IO",
      rateType: "variable",
      annualRate: 0.0589,
      repaymentAmount: 2747.33,
      repaymentCadence: "monthly",
      manualLoanBalance: 560000,
      notes: "IO period 3 years from settlement",
    },
  });

  await prisma.tenancyEvent.upsert({
    where: { id: `tenancy_c_${user.id}` },
    update: {},
    create: {
      id: `tenancy_c_${user.id}`,
      propertyId: propC.id,
      type: "START",
      effectiveDate: new Date("2026-02-15"),
      weeklyRent: 570,
      leaseTermMonths: 12,
      notes: "Initial tenancy",
    },
  });

  await prisma.recurringCostEvent.upsert({
    where: { id: `rc_c_mgmt_${user.id}` },
    update: {},
    create: {
      id: `rc_c_mgmt_${user.id}`,
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
    where: { id: `rc_c_insurance_${user.id}` },
    update: {},
    create: {
      id: `rc_c_insurance_${user.id}`,
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
    where: { id: `rc_c_strata_${user.id}` },
    update: {},
    create: {
      id: `rc_c_strata_${user.id}`,
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
    where: { id: `rc_c_council_${user.id}` },
    update: {},
    create: {
      id: `rc_c_council_${user.id}`,
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
    where: { id: `rc_c_water_${user.id}` },
    update: {},
    create: {
      id: `rc_c_water_${user.id}`,
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
    where: { id: `val_c_${user.id}` },
    update: {},
    create: {
      id: `val_c_${user.id}`,
      propertyId: propC.id,
      date: new Date("2026-12-31"),
      value: 749000,
      source: "SELF",
      notes: "Year 1 projection",
    },
  });

  // ─── Portfolio ─────────────────────────────────────────────────────────────

  const portfolio = await prisma.portfolio.upsert({
    where: { id: `portfolio_all_${user.id}` },
    update: { name: "All Properties" },
    create: {
      id: `portfolio_all_${user.id}`,
      userId: user.id,
      name: "All Properties",
      description: "Full portfolio",
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
  console.log(`\n🎉 Seed complete for ${user.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
