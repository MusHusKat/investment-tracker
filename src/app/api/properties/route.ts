import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user?.id ?? null;
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

  // Create property + purchase event atomically
  const property = await prisma.$transaction(async (tx) => {
    const prop = await tx.property.create({
      data: {
        userId,
        name: body.name,
        address: body.address ?? null,
        tags: body.tags ?? [],
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ?? null,
        ownershipPct: body.ownershipPct ?? 100,
        appreciationRate: body.appreciationRate ?? 0.05,
        notes: body.notes ?? null,
      },
    });

    // If purchase event fields provided, create it now
    if (body.purchase?.settlementDate && body.purchase?.purchasePrice) {
      await tx.purchaseEvent.create({
        data: {
          propertyId: prop.id,
          settlementDate: new Date(body.purchase.settlementDate),
          purchasePrice: body.purchase.purchasePrice,
          deposit: body.purchase.deposit ?? 0,
          stampDuty: body.purchase.stampDuty ?? 0,
          legalFees: body.purchase.legalFees ?? 0,
          buyersAgentFee: body.purchase.buyersAgentFee ?? 0,
          loanAmount: body.purchase.loanAmount ?? 0,
          notes: body.purchase.notes ?? null,
        },
      });
    }

    return prop;
  });

  return NextResponse.json(property, { status: 201 });
}
