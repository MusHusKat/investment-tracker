import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { WizardClient } from "./WizardClient";
import { decimalToNumber, currentYear } from "@/lib/utils";
import type { YearlySnapshotData } from "@/types";

export const dynamic = "force-dynamic";

export default async function WizardPage({
  searchParams,
}: {
  searchParams: { propertyId?: string; year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const properties = await prisma.property.findMany({
    where: { userId, isActive: true },
    include: {
      snapshots: { orderBy: { year: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  const initialPropertyId = searchParams.propertyId ?? properties[0]?.id ?? null;
  const initialYear = parseInt(searchParams.year ?? String(currentYear()));

  const selectedProp = initialPropertyId
    ? properties.find((p) => p.id === initialPropertyId)
    : null;

  const lastSnap = selectedProp?.snapshots.find((s) => s.year === initialYear - 1);
  const currentSnap = selectedProp?.snapshots.find((s) => s.year === initialYear);

  function snapToFormData(s: typeof lastSnap) {
    if (!s) return null;
    return {
      propertyId: s.propertyId,
      year: s.year,
      rentIncome: decimalToNumber(s.rentIncome) ?? 0,
      otherIncome: decimalToNumber(s.otherIncome) ?? 0,
      maintenance: decimalToNumber(s.maintenance) ?? 0,
      insurance: decimalToNumber(s.insurance) ?? 0,
      councilRates: decimalToNumber(s.councilRates) ?? 0,
      strataFees: decimalToNumber(s.strataFees) ?? 0,
      propertyMgmtFees: decimalToNumber(s.propertyMgmtFees) ?? 0,
      utilities: decimalToNumber(s.utilities) ?? 0,
      otherExpenses: decimalToNumber(s.otherExpenses) ?? 0,
      interestPaid: decimalToNumber(s.interestPaid) ?? 0,
      principalPaid: decimalToNumber(s.principalPaid) ?? 0,
      capex: decimalToNumber(s.capex) ?? 0,
      loanBalance: decimalToNumber(s.loanBalance) ?? 0,
      notes: s.notes ?? "",
    };
  }

  return (
    <AppShell>
      <WizardClient
        properties={properties.map((p) => ({
          id: p.id,
          name: p.name,
          availableYears: p.snapshots.map((s) => s.year),
        }))}
        initialPropertyId={initialPropertyId}
        initialYear={initialYear}
        lastYearData={snapToFormData(lastSnap)}
        existingData={snapToFormData(currentSnap)}
      />
    </AppShell>
  );
}
