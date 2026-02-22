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
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshots = await prisma.yearlySnapshot.findMany({
    where: { propertyId: params.id },
    orderBy: { year: "desc" },
  });

  return NextResponse.json(snapshots);
}
