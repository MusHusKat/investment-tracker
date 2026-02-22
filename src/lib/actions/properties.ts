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

const PropertySchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  tags: z.array(z.string()).default([]),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  ownershipPct: z.number().min(1).max(100).default(100),
  notes: z.string().optional(),
});

export async function createProperty(data: z.infer<typeof PropertySchema>) {
  const userId = await requireUserId();
  const parsed = PropertySchema.parse(data);

  const property = await prisma.property.create({
    data: {
      userId,
      name: parsed.name,
      address: parsed.address,
      tags: parsed.tags,
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
      purchasePrice: parsed.purchasePrice ?? null,
      ownershipPct: parsed.ownershipPct,
      notes: parsed.notes,
    },
  });

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  return property;
}

export async function updateProperty(
  id: string,
  data: z.infer<typeof PropertySchema>
) {
  const userId = await requireUserId();
  const parsed = PropertySchema.parse(data);

  // Verify ownership
  const existing = await prisma.property.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Property not found");

  const property = await prisma.property.update({
    where: { id },
    data: {
      name: parsed.name,
      address: parsed.address,
      tags: parsed.tags,
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
      purchasePrice: parsed.purchasePrice ?? null,
      ownershipPct: parsed.ownershipPct,
      notes: parsed.notes,
    },
  });

  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  return property;
}

export async function deleteProperty(id: string) {
  const userId = await requireUserId();

  await prisma.property.deleteMany({ where: { id, userId } });

  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

export async function duplicateProperty(id: string) {
  const userId = await requireUserId();

  const source = await prisma.property.findFirst({
    where: { id, userId },
    include: { loans: true },
  });
  if (!source) throw new Error("Property not found");

  const copy = await prisma.property.create({
    data: {
      userId,
      name: `${source.name} (Copy)`,
      address: source.address,
      tags: source.tags,
      purchaseDate: source.purchaseDate,
      purchasePrice: source.purchasePrice ? Number(source.purchasePrice) : null,
      ownershipPct: Number(source.ownershipPct),
      notes: source.notes,
    },
  });

  revalidatePath("/properties");
  return copy;
}
