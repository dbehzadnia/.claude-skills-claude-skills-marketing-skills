/** Login rate limiting stored in PostgreSQL (no Redis). */
import { db } from "./db";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILED_PER_USERNAME = 5;
export const MAX_FAILED_PER_IP = 20;

export async function isLoginBlocked(username: string, ip: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const [byUser, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { username, success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
  ]);
  return byUser >= MAX_FAILED_PER_USERNAME || byIp >= MAX_FAILED_PER_IP;
}

export async function recordLoginAttempt(username: string, ip: string, success: boolean): Promise<void> {
  await db.loginAttempt.create({ data: { username, ip, success } });
  if (success) {
    // A successful login clears this username's failed attempts.
    await db.loginAttempt.deleteMany({ where: { username, success: false } });
  }
}

/** Housekeeping: drop attempts older than a day. Called opportunistically on login. */
export async function pruneLoginAttempts(now = new Date()): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } } });
}
