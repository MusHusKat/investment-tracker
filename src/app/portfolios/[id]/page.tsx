import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CombinedViewClient } from "./CombinedViewClient";
import { decimalToNumber, currentYear } from "@/lib/utils";
import { aggregateKPIs, buildYearlyTrend } from "@/lib/aggregations";
import type { YearlySnapshotData } from "@/types";

export const dynamic = "force-dynamic";

export default async function PortfolioDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const year = parseInt(searchParams.year ?? String(currentYear()));

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: params.id, userId },
    include: {
      properties: {
        include: {
          property: {
            include: {
              snapshots: { orderBy: { year: "desc" } },
              valuations: { orderBy: { valuedAt: "desc" } },
            },
          },
        },
      },
    },
  });

  if (!portfolio) notFound();

  const propertyData = portfolio.properties.map(({ property: p }) => ({
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
      const s = p.snapshots.find((s) => s.year === year);
      if (!s) return null;
      return {
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
      } as YearlySnapshotData;
    })(),
  }));

  const currentAgg = aggregateKPIs(propertyData, year);
  const prevAgg = aggregateKPIs(propertyData, year - 1);
  const years = Array.from(
    { length: 5 },
    (_, i) => year - 4 + i
  );
  const trend = buildYearlyTrend(propertyData, years);

  return (
    <AppShell>
      <CombinedViewClient
        portfolio={{ id: portfolio.id, name: portfolio.name, description: portfolio.description }}
        year={year}
        currentAgg={currentAgg}
        prevAgg={prevAgg}
        trend={trend}
        missingProperties={currentAgg.missingSnapshots.map((id) => {
          const pd = propertyData.find((p) => p.property.id === id);
          return { id, name: pd?.property.name ?? id };
        })}
      />
    </AppShell>
  );
}
