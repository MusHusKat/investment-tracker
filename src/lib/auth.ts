import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { hash, createHmac } from "crypto";
import { NextRequest } from "next/server";

function simpleHash(password: string): string {
  return hash("sha256", password);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Dev mode: auto-create user on first login
        if (process.env.DEV_AUTH_ENABLED === "true") {
          const hashedPw = simpleHash(credentials.password);

          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            // Auto-register in dev mode
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split("@")[0],
                password: hashedPw,
              },
            });
          }

          if (user.password !== hashedPw) return null;

          return { id: user.id, email: user.email, name: user.name };
        }

        // Production: lookup only
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const hashedPw = simpleHash(credentials.password);
        if (user.password !== hashedPw) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string } & typeof session.user).id = token.id as string;
      }
      return session;
    },
  },
};

interface MobileSession {
  user: { id: string; email: string; name: string | null };
}

function verifyMobileJwt(token: string): MobileSession | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (expected !== sig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.id || !payload.email) return null;
    return { user: { id: payload.id, email: payload.email, name: payload.name ?? null } };
  } catch {
    return null;
  }
}

/**
 * Drop-in replacement for getServerSession that also accepts a mobile Bearer JWT.
 * Usage: const session = await getSession(req);
 */
export async function getSession(req: NextRequest): Promise<MobileSession | null> {
  // Try Bearer token first (mobile)
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    return verifyMobileJwt(token);
  }

  // Fall back to NextAuth cookie session (web)
  const session = await nextAuthGetServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as { id: string; email: string; name?: string | null };
  return { user: { id: user.id, email: user.email, name: user.name ?? null } };
}
