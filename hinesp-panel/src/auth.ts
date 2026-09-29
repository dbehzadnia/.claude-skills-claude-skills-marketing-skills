import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { verifyLogin } from "./server/services/auth";
import { clientIp } from "./server/request";

export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const result = await verifyLogin(parsed.data.username, parsed.data.password, clientIp(request.headers));
        if (result.status === "blocked") throw new RateLimitedSignin();
        if (result.status === "invalid") return null;
        return { id: result.user.id, name: result.user.fullName, tokenVersion: result.user.tokenVersion };
      },
    }),
  ],
});
