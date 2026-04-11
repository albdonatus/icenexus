import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type AppSession = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: Role;
    companyId: string;
  };
  expires: string;
};

const {
  handlers,
  auth: _auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.active) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId ?? user.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.companyId = (user as { companyId: string }).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as AppSession["user"]).id = token.id as string;
        (session.user as AppSession["user"]).role = token.role as Role;
        (session.user as AppSession["user"]).companyId = token.companyId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handlers, signIn, signOut };

// Para uso como middleware wrapper: auth((req) => { ... })
export { _auth as authMiddleware };

// auth() com tipo completo — sem depender do augmentation do NextAuth v5 beta
export const auth = _auth as unknown as () => Promise<AppSession | null>;
