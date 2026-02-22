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

  const rockhampton = await prisma.property.upsert({
    where: { id: "prop_rockhampton_house" },
    update: {
      name: "Rockhampton House",
      address: "193 Frenchville Road, QLD",
      tags: ["house", "queensland"],
      purchaseDate: new Date("2024-10-10"),
      purchasePrice: 550000,
      ownershipPct: 100,
      isActive: true,
      notes: null,
    },
    create: {
      id: "prop_rockhampton_house",
      userId: user.id,
      name: "Rockhampton House",
      address: "193 Frenchville Road, QLD",
      tags: ["house", "queensland"],
      purchaseDate: new Date("2024-10-10"),
      purchasePrice: 550000,
      ownershipPct: 100,
      isActive: true,
    },
  });

  console.log(`✅ Properties: ${rockhampton.name}`);

  // ─── Yearly Snapshots ─────────────────────────────────────────────────────

  await prisma.yearlySnapshot.upsert({
    where: {
      propertyId_year: { propertyId: rockhampton.id, year: 2025 },
    },
    update: {
      rentIncome: 22052.00,
      otherIncome: null,
      maintenance: 1370.50,
      insurance: 1500.00,
      councilRates: null,
      strataFees: null,
      propertyMgmtFees: 2803.70,
      utilities: 454.27,
      otherExpenses: null,
      interestPaid: 11648.00,
      principalPaid: 1733.00,
      capex: null,
      loanBalance: 432000.00,
      notes: null,
    },
    create: {
      propertyId: rockhampton.id,
      year: 2025,
      rentIncome: 22052.00,
      otherIncome: null,
      maintenance: 1370.50,
      insurance: 1500.00,
      councilRates: null,
      strataFees: null,
      propertyMgmtFees: 2803.70,
      utilities: 454.27,
      otherExpenses: null,
      interestPaid: 11648.00,
      principalPaid: 1733.00,
      capex: null,
      loanBalance: 432000.00,
      notes: null,
    },
  });

  console.log(`✅ Snapshots: 1 row (Rockhampton House / 2025)`);

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


const prisma = new PrismaClient();

function simpleHash(password: string): string {
  // Very simple hash for dev seed only — use bcrypt in production
  return hash("sha256", password);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
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

  // Create properties
  const prop1 = await prisma.property.upsert({
    where: { id: "prop_sydney_unit" },
    update: {},
    create: {
      id: "prop_sydney_unit",
      userId: user.id,
      name: "Sydney CBD Unit",
      address: "42 George St, Sydney NSW 2000",
      tags: ["unit", "sydney", "positive-cashflow"],
      purchaseDate: new Date("2018-06-15"),
      purchasePrice: 750000,
      ownershipPct: 100,
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { id: "prop_melbourne_house" },
    update: {},
    create: {
      id: "prop_melbourne_house",
      userId: user.id,
      name: "Melbourne Inner House",
      address: "7 Collins Lane, Fitzroy VIC 3065",
      tags: ["house", "melbourne", "negative-gearing"],
      purchaseDate: new Date("2020-03-01"),
      purchasePrice: 1100000,
      ownershipPct: 100,
    },
  });

  const prop3 = await prisma.property.upsert({
    where: { id: "prop_brisbane_townhouse" },
    update: {},
    create: {
      id: "prop_brisbane_townhouse",
      userId: user.id,
      name: "Brisbane Townhouse",
      address: "15 River Rd, New Farm QLD 4005",
      tags: ["townhouse", "brisbane"],
      purchaseDate: new Date("2021-09-10"),
      purchasePrice: 680000,
      ownershipPct: 50, // Joint ownership
    },
  });

  console.log(`✅ Properties: ${[prop1, prop2, prop3].map((p) => p.name).join(", ")}`);

  // Seed loans
  await prisma.loan.createMany({
    skipDuplicates: true,
    data: [
      {
        propertyId: prop1.id,
        lender: "CommBank",
        originalAmount: 562500,
        interestRate: 0.0589,
        loanType: "variable",
        startDate: new Date("2018-06-15"),
      },
      {
        propertyId: prop2.id,
        lender: "ANZ",
        originalAmount: 880000,
        interestRate: 0.0625,
        loanType: "fixed",
        fixedUntil: new Date("2025-03-01"),
        startDate: new Date("2020-03-01"),
      },
      {
        propertyId: prop3.id,
        lender: "Westpac",
        originalAmount: 544000,
        interestRate: 0.061,
        loanType: "variable",
        startDate: new Date("2021-09-10"),
      },
    ],
  });

  // Seed valuations
  await prisma.valuation.createMany({
    skipDuplicates: true,
    data: [
      {
        propertyId: prop1.id,
        valuedAt: new Date("2022-06-30"),
        value: 880000,
        source: "appraisal",
      },
      {
        propertyId: prop1.id,
        valuedAt: new Date("2023-06-30"),
        value: 940000,
        source: "estimate",
      },
      {
        propertyId: prop1.id,
        valuedAt: new Date("2024-06-30"),
        value: 985000,
        source: "appraisal",
      },
      {
        propertyId: prop2.id,
        valuedAt: new Date("2023-06-30"),
        value: 1380000,
        source: "appraisal",
      },
      {
        propertyId: prop2.id,
        valuedAt: new Date("2024-06-30"),
        value: 1450000,
        source: "estimate",
      },
      {
        propertyId: prop3.id,
        valuedAt: new Date("2023-06-30"),
        value: 780000,
        source: "estimate",
      },
      {
        propertyId: prop3.id,
        valuedAt: new Date("2024-06-30"),
        value: 820000,
        source: "appraisal",
      },
    ],
  });

  // Seed yearly snapshots for all 3 properties across 2021-2024
  const snapshotData = [
    // Sydney CBD Unit
    {
      propertyId: prop1.id,
      year: 2021,
      rentIncome: 32400,
      otherIncome: 0,
      maintenance: 1200,
      insurance: 1800,
      councilRates: 1500,
      strataFees: 4800,
      propertyMgmtFees: 2430,
      utilities: 0,
      otherExpenses: 500,
      interestPaid: 28500,
      principalPaid: 12000,
      capex: 0,
      loanBalance: 490000,
      notes: "Tenant renewed, no vacancy",
    },
    {
      propertyId: prop1.id,
      year: 2022,
      rentIncome: 36400,
      otherIncome: 500,
      maintenance: 2800,
      insurance: 1900,
      councilRates: 1550,
      strataFees: 5200,
      propertyMgmtFees: 2730,
      utilities: 0,
      otherExpenses: 600,
      interestPaid: 27000,
      principalPaid: 13000,
      capex: 4500, // new hot water system
      loanBalance: 477000,
      notes: "Hot water replacement capex",
    },
    {
      propertyId: prop1.id,
      year: 2023,
      rentIncome: 42000,
      otherIncome: 0,
      maintenance: 1500,
      insurance: 2100,
      councilRates: 1600,
      strataFees: 5400,
      propertyMgmtFees: 3150,
      utilities: 0,
      otherExpenses: 400,
      interestPaid: 29500,
      principalPaid: 14000,
      capex: 0,
      loanBalance: 463000,
      notes: null,
    },
    {
      propertyId: prop1.id,
      year: 2024,
      rentIncome: 46800,
      otherIncome: 0,
      maintenance: 900,
      insurance: 2200,
      councilRates: 1650,
      strataFees: 5600,
      propertyMgmtFees: 3510,
      utilities: 0,
      otherExpenses: 300,
      interestPaid: 27800,
      principalPaid: 15500,
      capex: 0,
      loanBalance: 447500,
      notes: "Strong rental growth",
    },
    // Melbourne Inner House
    {
      propertyId: prop2.id,
      year: 2021,
      rentIncome: 42000,
      otherIncome: 0,
      maintenance: 3500,
      insurance: 2400,
      councilRates: 2200,
      strataFees: 0,
      propertyMgmtFees: 3150,
      utilities: 800,
      otherExpenses: 700,
      interestPaid: 52800,
      principalPaid: 8000,
      capex: 0,
      loanBalance: 850000,
      notes: "COVID discount offered in Q1",
    },
    {
      propertyId: prop2.id,
      year: 2022,
      rentIncome: 48000,
      otherIncome: 0,
      maintenance: 6500,
      insurance: 2600,
      councilRates: 2300,
      strataFees: 0,
      propertyMgmtFees: 3600,
      utilities: 900,
      otherExpenses: 800,
      interestPaid: 55000,
      principalPaid: 8500,
      capex: 18000, // kitchen renovation
      loanBalance: 841500,
      notes: "Kitchen renovation capex",
    },
    {
      propertyId: prop2.id,
      year: 2023,
      rentIncome: 58000,
      otherIncome: 0,
      maintenance: 2800,
      insurance: 2800,
      councilRates: 2400,
      strataFees: 0,
      propertyMgmtFees: 4350,
      utilities: 950,
      otherExpenses: 600,
      interestPaid: 52500,
      principalPaid: 9000,
      capex: 0,
      loanBalance: 832500,
      notes: "Post-reno rental uplift",
    },
    {
      propertyId: prop2.id,
      year: 2024,
      rentIncome: 62400,
      otherIncome: 1200,
      maintenance: 3200,
      insurance: 2900,
      councilRates: 2500,
      strataFees: 0,
      propertyMgmtFees: 4680,
      utilities: 950,
      otherExpenses: 500,
      interestPaid: 52000,
      principalPaid: 9500,
      capex: 0,
      loanBalance: 823000,
      notes: null,
    },
    // Brisbane Townhouse
    {
      propertyId: prop3.id,
      year: 2022,
      rentIncome: 26000,
      otherIncome: 0,
      maintenance: 1800,
      insurance: 1600,
      councilRates: 1800,
      strataFees: 3200,
      propertyMgmtFees: 1950,
      utilities: 400,
      otherExpenses: 300,
      interestPaid: 31500,
      principalPaid: 6000,
      capex: 0,
      loanBalance: 520000,
      notes: "Purchased Sep 2021; partial year",
    },
    {
      propertyId: prop3.id,
      year: 2023,
      rentIncome: 33800,
      otherIncome: 0,
      maintenance: 2200,
      insurance: 1700,
      councilRates: 1900,
      strataFees: 3400,
      propertyMgmtFees: 2535,
      utilities: 450,
      otherExpenses: 400,
      interestPaid: 30800,
      principalPaid: 6500,
      capex: 0,
      loanBalance: 513500,
      notes: null,
    },
    {
      propertyId: prop3.id,
      year: 2024,
      rentIncome: 38480,
      otherIncome: 0,
      maintenance: 1500,
      insurance: 1750,
      councilRates: 1950,
      strataFees: 3600,
      propertyMgmtFees: 2886,
      utilities: 450,
      otherExpenses: 350,
      interestPaid: 30000,
      principalPaid: 7000,
      capex: 3500, // deck repair
      loanBalance: 506500,
      notes: "Deck repair capex",
    },
  ];

  for (const snap of snapshotData) {
    await prisma.yearlySnapshot.upsert({
      where: { propertyId_year: { propertyId: snap.propertyId, year: snap.year } },
      update: snap,
      create: snap,
    });
  }

  console.log(`✅ Snapshots: ${snapshotData.length} rows`);

  // Seed a portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { id: "portfolio_all" },
    update: { name: "All Properties" },
    create: {
      id: "portfolio_all",
      userId: user.id,
      name: "All Properties",
      description: "Complete portfolio view",
    },
  });

  const sydneyMelb = await prisma.portfolio.upsert({
    where: { id: "portfolio_eastern" },
    update: { name: "Eastern Seaboard" },
    create: {
      id: "portfolio_eastern",
      userId: user.id,
      name: "Eastern Seaboard",
      description: "Sydney + Melbourne properties",
    },
  });

  // Link properties to portfolios
  await prisma.portfolioProperty.createMany({
    skipDuplicates: true,
    data: [
      { portfolioId: portfolio.id, propertyId: prop1.id },
      { portfolioId: portfolio.id, propertyId: prop2.id },
      { portfolioId: portfolio.id, propertyId: prop3.id },
      { portfolioId: sydneyMelb.id, propertyId: prop1.id },
      { portfolioId: sydneyMelb.id, propertyId: prop2.id },
    ],
  });

  console.log(`✅ Portfolios: ${[portfolio, sydneyMelb].map((p) => p.name).join(", ")}`);
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
