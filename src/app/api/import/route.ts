import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvText } from "@/lib/csv";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user?.id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors } = parseCsvText(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found", errors }, { status: 400 });
  }

  // Get or create properties by name
  const userProperties = await prisma.property.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const propertyMap = new Map(userProperties.map((p) => [p.name.toLowerCase(), p.id]));
  const createdProperties: string[] = [];
  const allErrors = [...errors];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nameKey = row.property_name.toLowerCase();

    let propertyId = propertyMap.get(nameKey);

    if (!propertyId) {
      // Create new property
      const newProp = await prisma.property.create({
        data: {
          userId,
          name: row.property_name,
          ownershipPct: 100,
        },
      });
      propertyId = newProp.id;
      propertyMap.set(nameKey, propertyId);
      createdProperties.push(row.property_name);
    }

    try {
      const existing = await prisma.yearlySnapshot.findUnique({
        where: { propertyId_year: { propertyId, year: row.year } },
      });

      await prisma.yearlySnapshot.upsert({
        where: { propertyId_year: { propertyId, year: row.year } },
        update: {
          rentIncome: row.rent,
          otherIncome: row.other_income,
          maintenance: row.repairs,
          insurance: row.insurance,
          councilRates: row.rates,
          strataFees: row.strata,
          propertyMgmtFees: row.pm_fees,
          utilities: row.utilities,
          otherExpenses: row.other_expenses,
          interestPaid: row.interest_paid,
          principalPaid: row.principal_paid,
          capex: row.capex || null,
          notes: row.notes || null,
        },
        create: {
          propertyId,
          year: row.year,
          rentIncome: row.rent,
          otherIncome: row.other_income,
          maintenance: row.repairs,
          insurance: row.insurance,
          councilRates: row.rates,
          strataFees: row.strata,
          propertyMgmtFees: row.pm_fees,
          utilities: row.utilities,
          otherExpenses: row.other_expenses,
          interestPaid: row.interest_paid,
          principalPaid: row.principal_paid,
          capex: row.capex || null,
          notes: row.notes || null,
        },
      });

      if (existing) updated++;
      else created++;
    } catch (e) {
      allErrors.push({ row: i + 2, message: String(e) });
    }
  }

  return NextResponse.json({
    success: created + updated,
    created,
    updated,
    errors: allErrors,
    newProperties: createdProperties,
  });
}
