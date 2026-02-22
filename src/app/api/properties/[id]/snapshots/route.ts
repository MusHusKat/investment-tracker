import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
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
