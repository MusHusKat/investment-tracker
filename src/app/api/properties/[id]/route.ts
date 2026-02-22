import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, userId },
    include: {
      snapshots: { orderBy: { year: "desc" } },
      loans: true,
      valuations: { orderBy: { valuedAt: "desc" } },
    },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(property);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.property.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const property = await prisma.property.update({
    where: { id: params.id },
    data: {
      name: body.name,
      address: body.address ?? null,
      tags: body.tags ?? [],
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ?? null,
      ownershipPct: body.ownershipPct ?? 100,
      notes: body.notes ?? null,
      isActive: body.isActive ?? true,
      ...(body.appreciationRate != null ? { appreciationRate: body.appreciationRate } : {}),
    },
  });

  return NextResponse.json(property);
}

/** PATCH: partial update — useful for updating just appreciationRate from mobile */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.property.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.ownershipPct !== undefined) updateData.ownershipPct = body.ownershipPct;
  if (body.appreciationRate !== undefined) updateData.appreciationRate = body.appreciationRate;

  const property = await prisma.property.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(property);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.property.deleteMany({ where: { id: params.id, userId } });

  return NextResponse.json({ success: true });
}
