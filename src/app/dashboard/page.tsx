import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardClient } from "./DashboardClient";
import { computeKPIs, resolveReferenceValue } from "@/lib/calculations";
import { aggregateKPIs, buildYearlyTrend } from "@/lib/aggregations";
import { decimalToNumber, currentYear } from "@/lib/utils";
import type { YearlySnapshotData } from "@/types";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string, year: number) {
  const properties = await prisma.property.findMany({
    where: { userId, isActive: true },
    include: {
      snapshots: { orderBy: { year: "desc" } },
      valuations: { orderBy: { valuedAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      properties: { select: { propertyId: true } },
    },
    orderBy: { name: "asc" },
  });

  const allYears = [year, year - 1, year - 2, year - 3, year - 4];

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
    snapshot: (() => {
      const snap = p.snapshots.find((s) => s.year === year);
      if (!snap) return null;
      return {
        id: snap.id,
        propertyId: snap.propertyId,
        year: snap.year,
        rentIncome: decimalToNumber(snap.rentIncome),
        otherIncome: decimalToNumber(snap.otherIncome),
        maintenance: decimalToNumber(snap.maintenance),
        insurance: decimalToNumber(snap.insurance),
        councilRates: decimalToNumber(snap.councilRates),
        strataFees: decimalToNumber(snap.strataFees),
        propertyMgmtFees: decimalToNumber(snap.propertyMgmtFees),
        utilities: decimalToNumber(snap.utilities),
        otherExpenses: decimalToNumber(snap.otherExpenses),
        interestPaid: decimalToNumber(snap.interestPaid),
        principalPaid: decimalToNumber(snap.principalPaid),
        capex: decimalToNumber(snap.capex),
        loanBalance: decimalToNumber(snap.loanBalance),
        notes: snap.notes,
      } as YearlySnapshotData;
    })(),
  }));

  const currentAgg = aggregateKPIs(propertyData, year);
  const prevAgg = aggregateKPIs(propertyData, year - 1);

  const trend = buildYearlyTrend(propertyData, allYears.reverse());

  return { currentAgg, prevAgg, trend, portfolios, propertyData };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const year = parseInt(searchParams.year ?? String(currentYear()));

  const data = await getDashboardData(userId, year);

  return (
    <AppShell>
      <DashboardClient
        initialYear={year}
        currentAgg={data.currentAgg}
        prevAgg={data.prevAgg}
        trend={data.trend}
        portfolios={data.portfolios.map((p) => ({
          id: p.id,
          name: p.name,
          propertyIds: p.properties.map((pp) => pp.propertyId),
        }))}
        missingProperties={data.currentAgg.missingSnapshots.map((id) => {
          const prop = data.propertyData.find((p) => p.property.id === id);
          return { id, name: prop?.property.name ?? id };
        })}
      />
    </AppShell>
  );
}
