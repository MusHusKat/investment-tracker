import { PrismaClient } from "@prisma/client";
import { hash } from "crypto";

const prisma = new PrismaClient();

function simpleHash(password: string): string {
  // Simple hash for dev seed only — use bcrypt in production
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
  //
  // A  193 Frenchville Rd | Frenchville QLD 4701 | House   — purchased Nov 2024
  // B  22/208 North Beach Dr | Tuart Hill WA 6060 | Villa  — purchased Feb 2025
  // C  6/1 Golden Avenue | Chelsea VIC 3196 | Villa        — purchased Feb 2026

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
      notes:
        "Buyers agent 2.5% ($13,875). Stamp duty $18,000. I/O 5 yrs @ 5.74%. Offset $150k.",
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
      notes:
        "Buyers agent 2.5% ($13,875). Stamp duty $18,000. I/O 5 yrs @ 5.74%. Offset $150k.",
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
      notes:
        "Buyers agent 2.5% ($13,250). Stamp duty $19,190. I/O 3 yrs @ 4.99%. No offset.",
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
      notes:
        "Buyers agent 2.5% ($13,250). Stamp duty $19,190. I/O 3 yrs @ 4.99%. No offset.",
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
      notes:
        "Buyers agent 2.5% ($17,500). Stamp duty $37,070. I/O 3 yrs @ 5.89%. No offset.",
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
      notes:
        "Buyers agent 2.5% ($17,500). Stamp duty $37,070. I/O 3 yrs @ 5.89%. No offset.",
    },
  });

  console.log(
    `✅ Properties: ${[propA, propB, propC].map((p) => p.name).join(", ")}`
  );

  // ─── Yearly Snapshots ─────────────────────────────────────────────────────
  //
  // "Year 1" in the spreadsheet = first partial/full fiscal year of ownership.
  // Mapped to calendar year as follows:
  //   A (bought Nov 2024) → Year 1 spreadsheet = 2025 (partial, ~2 months in 2024 + rest of FY)
  //   B (bought Feb 2025) → Year 1 spreadsheet = 2025 (partial year)
  //   C (bought Feb 2026) → no actuals yet; Year 1 spreadsheet = 2026 (partial)
  //
  // Expense mapping from spreadsheet:
  //   MngtCost  → propertyMgmtFees  (management + letting + advertising + admin)
  //   Insurance → insurance (from Total Costs "Insr." column)
  //   Repairs   → maintenance (from Total Costs "Repairs" column)
  //   Water/Council/Strata → councilRates / strataFees / utilities

  // ── A: 193 Frenchville Rd — Year 2025 ────────────────────────────────────
  // Spreadsheet Year 1:
  //   Rent $22,052 | MngtCost $4,637.30 | Tax Rebate -$1,880
  //   Interest $11,648.12 | Principal $1,732.88 | Loan Left $431,167.12
  //   Equity $208,832.88 | LVR 67.37% | Cashflow $2,153.70 | Est. Value $640,000
  // Expense detail:
  //   Insurance $2,042 | Repairs/Maintenance $2,500 | Water $2,500 | Council $0 | Strata $1,500
  //   MngtCost total $4,637.30 covers: management 8% + letting 1wk + advertising + lease renewal + admin

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propA.id, year: 2025 } },
    update: {
      rentIncome: 22052.0,
      otherIncome: null,
      maintenance: 2500.0,
      insurance: 2042.0,
      councilRates: 0.0,
      strataFees: 1500.0,
      propertyMgmtFees: 4637.3,
      utilities: 2500.0, // water rates
      otherExpenses: null,
      interestPaid: 11648.12,
      principalPaid: 1732.88,
      capex: null,
      loanBalance: 431167.12,
      notes:
        "Partial year (purchased Nov 2024). Est. value $640k. Offset $150k active.",
    },
    create: {
      propertyId: propA.id,
      year: 2025,
      rentIncome: 22052.0,
      otherIncome: null,
      maintenance: 2500.0,
      insurance: 2042.0,
      councilRates: 0.0,
      strataFees: 1500.0,
      propertyMgmtFees: 4637.3,
      utilities: 2500.0,
      otherExpenses: null,
      interestPaid: 11648.12,
      principalPaid: 1732.88,
      capex: null,
      loanBalance: 431167.12,
      notes:
        "Partial year (purchased Nov 2024). Est. value $640k. Offset $150k active.",
    },
  });

  // ── B: 22/208 North Beach Dr — Year 2025 ─────────────────────────────────
  // Spreadsheet Year 1:
  //   Rent $10,980 | MngtCost $4,552.60 | Tax Rebate $1,880
  //   Interest $10,022.29 | Principal $349.71 | Loan Left $424,000
  //   Equity $176,000 | LVR 70.67% | Cashflow -$2,064.60 | Est. Value $600,000
  // Expense detail:
  //   Insurance $0 (not depreciated) | Repairs $2,500 | Land/Water $325 | Strata $3,000 | Council $2,500
  //   MngtCost $4,552.60: management 7.15% + letting + advertising + PCR + final bond + inspection + renewal

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propB.id, year: 2025 } },
    update: {
      rentIncome: 10980.0,
      otherIncome: null,
      maintenance: 2500.0,
      insurance: 0.0,
      councilRates: 2500.0,
      strataFees: 3000.0,
      propertyMgmtFees: 4552.6,
      utilities: 325.0, // land/water rates
      otherExpenses: null,
      interestPaid: 10022.29,
      principalPaid: 349.71,
      capex: null,
      loanBalance: 424000.0,
      notes:
        "Partial year (purchased Feb 2025). Est. value $600k. I/O period.",
    },
    create: {
      propertyId: propB.id,
      year: 2025,
      rentIncome: 10980.0,
      otherIncome: null,
      maintenance: 2500.0,
      insurance: 0.0,
      councilRates: 2500.0,
      strataFees: 3000.0,
      propertyMgmtFees: 4552.6,
      utilities: 325.0,
      otherExpenses: null,
      interestPaid: 10022.29,
      principalPaid: 349.71,
      capex: null,
      loanBalance: 424000.0,
      notes:
        "Partial year (purchased Feb 2025). Est. value $600k. I/O period.",
    },
  });

  // ── C: 6/1 Golden Avenue, Chelsea — Year 2026 ────────────────────────────
  // Purchased Feb 2026 — seeding with spreadsheet Year 1 projections as a
  // starting-point snapshot. Mark as projected until actuals are available.
  // Spreadsheet Year 1:
  //   Rent $29,638 | MngtCost $12,338.80 | Tax Rebate $7,520
  //   Interest $32,984 | Principal $0 | Loan Left $560,000
  //   Equity $189,000 | LVR 74.77% | Cashflow -$8,164.80 | Est. Value $749,000
  // Expense detail:
  //   Insurance $500 | Repairs $3,000 | Land/Water $975 | Strata $1,585 | Council $2,420
  //   MngtCost $12,338.80: management 8% + letting + advertising + PCR + final bond + inspection + renewal

  await prisma.yearlySnapshot.upsert({
    where: { propertyId_year: { propertyId: propC.id, year: 2026 } },
    update: {
      rentIncome: 29638.0,
      otherIncome: null,
      maintenance: 3000.0,
      insurance: 500.0,
      councilRates: 2420.0,
      strataFees: 1585.0,
      propertyMgmtFees: 12338.8,
      utilities: 975.0, // land/water rates
      otherExpenses: null,
      interestPaid: 32984.0,
      principalPaid: 0.0,
      capex: null,
      loanBalance: 560000.0,
      notes:
        "Projected Year 1 (purchased Feb 2026). Est. value $749k. I/O period. Update with actuals during FY.",
    },
    create: {
      propertyId: propC.id,
      year: 2026,
      rentIncome: 29638.0,
      otherIncome: null,
      maintenance: 3000.0,
      insurance: 500.0,
      councilRates: 2420.0,
      strataFees: 1585.0,
      propertyMgmtFees: 12338.8,
      utilities: 975.0,
      otherExpenses: null,
      interestPaid: 32984.0,
      principalPaid: 0.0,
      capex: null,
      loanBalance: 560000.0,
      notes:
        "Projected Year 1 (purchased Feb 2026). Est. value $749k. I/O period. Update with actuals during FY.",
    },
  });

  console.log(
    `✅ Snapshots: 2025 (A+B), 2026 (C projected)`
  );

  // ─── Loans ────────────────────────────────────────────────────────────────

  await prisma.loan.createMany({
    skipDuplicates: true,
    data: [
      {
        propertyId: propA.id,
        lender: "Unknown",
        originalAmount: 432900,
        interestRate: 0.0574,
        loanType: "interest-only",
        fixedUntil: null,
        startDate: new Date("2024-11-01"),
      },
      {
        propertyId: propB.id,
        lender: "Unknown",
        originalAmount: 424000,
        interestRate: 0.0499,
        loanType: "interest-only",
        fixedUntil: null,
        startDate: new Date("2025-02-01"),
      },
      {
        propertyId: propC.id,
        lender: "Unknown",
        originalAmount: 560000,
        interestRate: 0.0589,
        loanType: "interest-only",
        fixedUntil: null,
        startDate: new Date("2026-02-01"),
      },
    ],
  });

  console.log(`✅ Loans: 3 rows`);

  // ─── Valuations ───────────────────────────────────────────────────────────
  // Seeding the spreadsheet's Year 1 estimated values as at end of first year.

  await prisma.valuation.createMany({
    skipDuplicates: true,
    data: [
      {
        propertyId: propA.id,
        valuedAt: new Date("2025-12-31"),
        value: 640000,
        source: "estimate",
        notes: "Spreadsheet Year 1 estimate",
      },
      {
        propertyId: propB.id,
        valuedAt: new Date("2025-12-31"),
        value: 600000,
        source: "estimate",
        notes: "Spreadsheet Year 1 estimate",
      },
      {
        propertyId: propC.id,
        valuedAt: new Date("2026-12-31"),
        value: 749000,
        source: "estimate",
        notes: "Spreadsheet Year 1 projection",
      },
    ],
  });

  console.log(`✅ Valuations: 3 rows`);

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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
