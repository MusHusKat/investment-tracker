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

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: params.id, userId },
    include: {
      properties: {
        include: {
          property: {
            include: {
              snapshots: { orderBy: { year: "desc" } },
              valuations: { orderBy: { valuedAt: "desc" } },
              loans: true,
            },
          },
        },
      },
    },
  });

  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(portfolio);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.portfolio.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  await prisma.portfolioProperty.deleteMany({ where: { portfolioId: params.id } });

  const portfolio = await prisma.portfolio.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description ?? null,
      properties: {
        create: (body.propertyIds ?? []).map((pid: string) => ({
          property: { connect: { id: pid } },
        })),
      },
    },
    include: { properties: { include: { property: true } } },
  });

  return NextResponse.json(portfolio);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.portfolio.deleteMany({ where: { id: params.id, userId } });

  return NextResponse.json({ success: true });
}
