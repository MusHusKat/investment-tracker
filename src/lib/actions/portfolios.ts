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

const PortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  propertyIds: z.array(z.string()),
});

export async function createPortfolio(data: z.infer<typeof PortfolioSchema>) {
  const userId = await requireUserId();
  const parsed = PortfolioSchema.parse(data);

  const portfolio = await prisma.portfolio.create({
    data: {
      userId,
      name: parsed.name,
      description: parsed.description,
      properties: {
        create: parsed.propertyIds.map((pid) => ({
          property: { connect: { id: pid } },
        })),
      },
    },
    include: { properties: true },
  });

  revalidatePath("/portfolios");
  return portfolio;
}

export async function updatePortfolio(
  id: string,
  data: z.infer<typeof PortfolioSchema>
) {
  const userId = await requireUserId();
  const parsed = PortfolioSchema.parse(data);

  const existing = await prisma.portfolio.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Portfolio not found");

  // Replace all property links
  await prisma.portfolioProperty.deleteMany({ where: { portfolioId: id } });

  const portfolio = await prisma.portfolio.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      properties: {
        create: parsed.propertyIds.map((pid) => ({
          property: { connect: { id: pid } },
        })),
      },
    },
    include: { properties: true },
  });

  revalidatePath(`/portfolios/${id}`);
  revalidatePath("/portfolios");
  return portfolio;
}

export async function deletePortfolio(id: string) {
  const userId = await requireUserId();
  await prisma.portfolio.deleteMany({ where: { id, userId } });
  revalidatePath("/portfolios");
}
