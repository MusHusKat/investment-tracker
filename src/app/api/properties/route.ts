import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeSnapshots = searchParams.get("includeSnapshots") === "true";

  const properties = await prisma.property.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      snapshots: includeSnapshots,
      loans: true,
      valuations: { orderBy: { valuedAt: "desc" } },
      _count: { select: { snapshots: true } },
    },
  });

  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const property = await prisma.property.create({
    data: {
      userId,
      name: body.name,
      address: body.address ?? null,
      tags: body.tags ?? [],
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ?? null,
      ownershipPct: body.ownershipPct ?? 100,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
