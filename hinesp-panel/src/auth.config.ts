/** Edge-safe Auth.js config shared by middleware and the full auth setup. */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    // Middleware only checks that a session exists. Real authorization happens on the server.
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/login")) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.tv = user.tokenVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      session.tv = typeof token.tv === "number" ? token.tv : -1;
      return session;
    },
  },
} satisfies NextAuthConfig;
