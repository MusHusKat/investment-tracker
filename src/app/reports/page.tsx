import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsClient } from "./ReportsClient";
import { decimalToNumber, currentYear } from "@/lib/utils";
import { aggregateKPIs } from "@/lib/aggregations";
import type { YearlySnapshotData } from "@/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const year = parseInt(searchParams.year ?? String(currentYear()));

  const [properties, portfolios] = await Promise.all([
    prisma.property.findMany({
      where: { userId, isActive: true },
      include: {
        snapshots: { orderBy: { year: "desc" } },
        valuations: { orderBy: { valuedAt: "desc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.portfolio.findMany({
      where: { userId },
      include: { properties: { select: { propertyId: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build multi-year data
  const years = Array.from({ length: 5 }, (_, i) => year - 4 + i);

  const propertyData = properties.map((p) => ({
    property: {
      id: p.id,
      name: p.name,
      address: p.address,
      tags: p.tags,
      purchaseDate: p.purchaseDate,
      purchasePrice: decimalToNumber(p.purchasePrice),
      ownershipPct: decimalToNumber(p.ownershipPct) ?? 100,
      isActive: p.isActive,
      valuations: p.valuations.map((v) => ({
        valuedAt: v.valuedAt,
        value: decimalToNumber(v.value) ?? 0,
      })),
    },
    snapshots: p.snapshots.map((s): YearlySnapshotData => ({
      id: s.id,
      propertyId: s.propertyId,
      year: s.year,
      rentIncome: decimalToNumber(s.rentIncome),
      otherIncome: decimalToNumber(s.otherIncome),
      maintenance: decimalToNumber(s.maintenance),
      insurance: decimalToNumber(s.insurance),
      councilRates: decimalToNumber(s.councilRates),
      strataFees: decimalToNumber(s.strataFees),
      propertyMgmtFees: decimalToNumber(s.propertyMgmtFees),
      utilities: decimalToNumber(s.utilities),
      otherExpenses: decimalToNumber(s.otherExpenses),
      interestPaid: decimalToNumber(s.interestPaid),
      principalPaid: decimalToNumber(s.principalPaid),
      capex: decimalToNumber(s.capex),
      loanBalance: decimalToNumber(s.loanBalance),
      notes: s.notes,
    })),
  }));

  const yearlyAggs = years.map((y) => ({
    year: y,
    agg: aggregateKPIs(
      propertyData.map((pd) => ({
        property: pd.property,
        snapshot: pd.snapshots.find((s) => s.year === y) ?? null,
      })),
      y
    ),
  }));

  return (
    <AppShell>
      <ReportsClient
        year={year}
        yearlyAggs={yearlyAggs}
        portfolios={portfolios.map((p) => ({
          id: p.id,
          name: p.name,
          propertyIds: p.properties.map((pp) => pp.propertyId),
        }))}
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
      />
    </AppShell>
  );
}
