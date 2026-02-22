import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { hash } from "crypto";

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
