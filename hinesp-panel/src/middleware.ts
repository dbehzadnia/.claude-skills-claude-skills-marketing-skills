import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // API routes authenticate themselves (session, cron secret or API token).
  matcher: ["/((?!api|_next/static|_next/image|fonts|favicon.ico).*)"],
};
