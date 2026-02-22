import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      properties: {
        include: {
          property: {
            select: { id: true, name: true, tags: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(portfolios);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const portfolio = await prisma.portfolio.create({
    data: {
      userId,
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

  return NextResponse.json(portfolio, { status: 201 });
}
