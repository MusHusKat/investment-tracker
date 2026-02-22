"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  return (session.user as { id: string }).id;
}

const SnapshotSchema = z.object({
  propertyId: z.string(),
  year: z.number().int().min(2000).max(2100),
  rentIncome: z.number().min(0).nullable(),
  otherIncome: z.number().min(0).nullable(),
  maintenance: z.number().min(0).nullable(),
  insurance: z.number().min(0).nullable(),
  councilRates: z.number().min(0).nullable(),
  strataFees: z.number().min(0).nullable(),
  propertyMgmtFees: z.number().min(0).nullable(),
  utilities: z.number().min(0).nullable(),
  otherExpenses: z.number().min(0).nullable(),
  interestPaid: z.number().min(0).nullable(),
  principalPaid: z.number().min(0).nullable(),
  capex: z.number().min(0).nullable(),
  loanBalance: z.number().min(0).nullable(),
  notes: z.string().nullable(),
});

export type SnapshotInput = z.infer<typeof SnapshotSchema>;

export async function upsertSnapshot(data: SnapshotInput) {
  const userId = await requireUserId();

  const parsed = SnapshotSchema.parse(data);

  // Verify property belongs to user
  const property = await prisma.property.findFirst({
    where: { id: parsed.propertyId, userId },
  });
  if (!property) throw new Error("Property not found");

  const snapshot = await prisma.yearlySnapshot.upsert({
    where: {
      propertyId_year: {
        propertyId: parsed.propertyId,
        year: parsed.year,
      },
    },
    update: {
      rentIncome: parsed.rentIncome,
      otherIncome: parsed.otherIncome,
      maintenance: parsed.maintenance,
      insurance: parsed.insurance,
      councilRates: parsed.councilRates,
      strataFees: parsed.strataFees,
      propertyMgmtFees: parsed.propertyMgmtFees,
      utilities: parsed.utilities,
      otherExpenses: parsed.otherExpenses,
      interestPaid: parsed.interestPaid,
      principalPaid: parsed.principalPaid,
      capex: parsed.capex,
      loanBalance: parsed.loanBalance,
      notes: parsed.notes,
    },
    create: {
      propertyId: parsed.propertyId,
      year: parsed.year,
      rentIncome: parsed.rentIncome,
      otherIncome: parsed.otherIncome,
      maintenance: parsed.maintenance,
      insurance: parsed.insurance,
      councilRates: parsed.councilRates,
      strataFees: parsed.strataFees,
      propertyMgmtFees: parsed.propertyMgmtFees,
      utilities: parsed.utilities,
      otherExpenses: parsed.otherExpenses,
      interestPaid: parsed.interestPaid,
      principalPaid: parsed.principalPaid,
      capex: parsed.capex,
      loanBalance: parsed.loanBalance,
      notes: parsed.notes,
    },
  });

  revalidatePath(`/properties/${parsed.propertyId}`);
  revalidatePath("/dashboard");
  return snapshot;
}

export async function deleteSnapshot(snapshotId: string) {
  const userId = await requireUserId();

  const snap = await prisma.yearlySnapshot.findFirst({
    where: { id: snapshotId, property: { userId } },
  });
  if (!snap) throw new Error("Snapshot not found");

  await prisma.yearlySnapshot.delete({ where: { id: snapshotId } });

  revalidatePath(`/properties/${snap.propertyId}`);
  revalidatePath("/dashboard");
}

/** Copy last year's snapshot into a new year */
export async function copyLastYearSnapshot(propertyId: string, fromYear: number, toYear: number) {
  const userId = await requireUserId();

  const property = await prisma.property.findFirst({ where: { id: propertyId, userId } });
  if (!property) throw new Error("Property not found");

  const source = await prisma.yearlySnapshot.findUnique({
    where: { propertyId_year: { propertyId, year: fromYear } },
  });
  if (!source) throw new Error(`No snapshot found for ${fromYear}`);

  // Check target doesn't exist
  const existing = await prisma.yearlySnapshot.findUnique({
    where: { propertyId_year: { propertyId, year: toYear } },
  });
  if (existing) throw new Error(`Snapshot for ${toYear} already exists`);

  const copy = await prisma.yearlySnapshot.create({
    data: {
      propertyId,
      year: toYear,
      rentIncome: source.rentIncome,
      otherIncome: source.otherIncome,
      maintenance: source.maintenance,
      insurance: source.insurance,
      councilRates: source.councilRates,
      strataFees: source.strataFees,
      propertyMgmtFees: source.propertyMgmtFees,
      utilities: source.utilities,
      otherExpenses: source.otherExpenses,
      interestPaid: source.interestPaid,
      principalPaid: source.principalPaid,
      capex: null, // Reset capex on copy
      loanBalance: source.loanBalance,
      notes: `Copied from ${fromYear}`,
    },
  });

  revalidatePath(`/properties/${propertyId}`);
  return copy;
}
