import { db } from "../db";
import { isLoginBlocked, pruneLoginAttempts, recordLoginAttempt } from "../rate-limit";
import { verifyPassword } from "../password";

export type LoginResult =
  | { status: "ok"; user: { id: string; tokenVersion: number; fullName: string } }
  | { status: "invalid" }
  | { status: "blocked" };

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function verifyLogin(rawUsername: string, password: string, ip: string): Promise<LoginResult> {
  const username = normalizeUsername(rawUsername);
  if (await isLoginBlocked(username, ip)) return { status: "blocked" };

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true, active: true, tokenVersion: true, fullName: true },
  });
  const ok = !!user && user.active && (await verifyPassword(password, user.passwordHash));
  await recordLoginAttempt(username, ip, ok);
  if (Math.random() < 0.05) await pruneLoginAttempts();
  if (!ok || !user) return { status: "invalid" };
  return { status: "ok", user: { id: user.id, tokenVersion: user.tokenVersion, fullName: user.fullName } };
}
