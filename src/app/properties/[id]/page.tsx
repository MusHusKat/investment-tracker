import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyDetailClient } from "./PropertyDetailClient";
import { decimalToNumber } from "@/lib/utils";
import type { YearlySnapshotData } from "@/types";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const property = await prisma.property.findFirst({
    where: { id: params.id, userId },
    include: {
      snapshots: { orderBy: { year: "desc" } },
      valuations: { orderBy: { valuedAt: "desc" } },
      loans: true,
    },
  });

  if (!property) notFound();

  const years = property.snapshots.map((s) => s.year);
  const activeYear = searchParams.year
    ? parseInt(searchParams.year)
    : years[0] ?? new Date().getFullYear();

  const snapshots: YearlySnapshotData[] = property.snapshots.map((s) => ({
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
  }));

  return (
    <AppShell>
      <PropertyDetailClient
        property={{
          id: property.id,
          name: property.name,
          address: property.address,
          tags: property.tags,
          purchaseDate: property.purchaseDate?.toISOString().split("T")[0] ?? null,
          purchasePrice: decimalToNumber(property.purchasePrice),
          ownershipPct: decimalToNumber(property.ownershipPct) ?? 100,
          isActive: property.isActive,
          notes: property.notes,
        }}
        snapshots={snapshots}
        valuations={property.valuations.map((v) => ({
          id: v.id,
          valuedAt: v.valuedAt.toISOString().split("T")[0],
          value: decimalToNumber(v.value) ?? 0,
          source: v.source,
        }))}
        loans={property.loans.map((l) => ({
          id: l.id,
          lender: l.lender,
          originalAmount: decimalToNumber(l.originalAmount),
          interestRate: decimalToNumber(l.interestRate),
          loanType: l.loanType,
        }))}
        activeYear={activeYear}
        availableYears={years}
      />
    </AppShell>
  );
}
