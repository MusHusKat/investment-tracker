import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Verify property belongs to user
  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, userId },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const snapshot = await prisma.yearlySnapshot.upsert({
    where: {
      propertyId_year: { propertyId: body.propertyId, year: body.year },
    },
    update: {
      rentIncome: body.rentIncome ?? null,
      otherIncome: body.otherIncome ?? null,
      maintenance: body.maintenance ?? null,
      insurance: body.insurance ?? null,
      councilRates: body.councilRates ?? null,
      strataFees: body.strataFees ?? null,
      propertyMgmtFees: body.propertyMgmtFees ?? null,
      utilities: body.utilities ?? null,
      otherExpenses: body.otherExpenses ?? null,
      interestPaid: body.interestPaid ?? null,
      principalPaid: body.principalPaid ?? null,
      capex: body.capex ?? null,
      loanBalance: body.loanBalance ?? null,
      notes: body.notes ?? null,
    },
    create: {
      propertyId: body.propertyId,
      year: body.year,
      rentIncome: body.rentIncome ?? null,
      otherIncome: body.otherIncome ?? null,
      maintenance: body.maintenance ?? null,
      insurance: body.insurance ?? null,
      councilRates: body.councilRates ?? null,
      strataFees: body.strataFees ?? null,
      propertyMgmtFees: body.propertyMgmtFees ?? null,
      utilities: body.utilities ?? null,
      otherExpenses: body.otherExpenses ?? null,
      interestPaid: body.interestPaid ?? null,
      principalPaid: body.principalPaid ?? null,
      capex: body.capex ?? null,
      loanBalance: body.loanBalance ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(snapshot, { status: 200 });
}
