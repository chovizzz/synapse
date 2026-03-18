import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MOCK_USERS } from "@/lib/mock-data";

function getUsers() {
  // Server-side only: read from mock data (in production would query DB)
  return MOCK_USERS;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const users = getUsers();
        // Demo mode: match by email, any password works
        const user = users.find(
          (u) => u.email === (credentials.email as string)
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
