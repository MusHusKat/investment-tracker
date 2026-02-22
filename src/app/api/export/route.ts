import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsvString, snapshotToExportRow } from "@/lib/csv";
import { computeKPIs, resolveReferenceValue } from "@/lib/calculations";
import { decimalToNumber } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const portfolioId = searchParams.get("portfolioId");

  const properties = await prisma.property.findMany({
    where: {
      userId,
      ...(portfolioId
        ? { portfolioProperties: { some: { portfolioId } } }
        : {}),
    },
    include: {
      snapshots: {
        where: yearParam ? { year: parseInt(yearParam) } : undefined,
        orderBy: { year: "desc" },
      },
      valuations: { orderBy: { valuedAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  const rows = [];

  for (const property of properties) {
    for (const snap of property.snapshots) {
      const refValue = resolveReferenceValue(
        snap.year,
        property.valuations.map((v) => ({
          valuedAt: v.valuedAt,
          value: decimalToNumber(v.value) ?? 0,
        })),
        decimalToNumber(property.purchasePrice)
      );

      const snapData = {
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
      };

      const kpis = computeKPIs(snapData, refValue, decimalToNumber(property.ownershipPct) ?? 100);

      rows.push(
        snapshotToExportRow(
          property.name,
          snapData,
          kpis.noi,
          kpis.cashflowPrePrincipal,
          kpis.cashflowPostPrincipal
        )
      );
    }
  }

  const csv = toCsvString(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="investment-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
