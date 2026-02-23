/**
 * Add a user to the database.
 *
 * Usage:
 *   pnpm db:add-user <email> <password> [name]
 *
 * Examples:
 *   pnpm db:add-user alice@example.com secretpass "Alice Smith"
 *   pnpm db:add-user bob@example.com hunter2
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "crypto";

const prisma = new PrismaClient();

function simpleHash(password: string): string {
  return hash("sha256", password);
}

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: pnpm db:add-user <email> <password> [name]");
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Invalid email: ${email}`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User already exists: ${email}`);
    process.exit(1);
  }

  const derivedName = name ?? email.split("@")[0];

  const user = await prisma.user.create({
    data: {
      email,
      name: derivedName,
      password: simpleHash(password),
    },
  });

  console.log(`✅ Created user: ${user.email} (${user.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
