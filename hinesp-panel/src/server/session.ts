import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";
import type { Actor } from "./authz";
import { UnauthorizedError } from "./errors";

export type CurrentUser = Actor & { username: string; fullName: string; departmentName: string };

/**
 * The signed-in user, loaded fresh from the database on every request so that
 * role changes, deactivation and password resets take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const u = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      fullName: true,
      roles: true,
      departmentId: true,
      active: true,
      tokenVersion: true,
      department: { select: { name: true } },
    },
  });
  if (!u || !u.active || u.tokenVersion !== session.tv) return null;
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    roles: u.roles,
    departmentId: u.departmentId,
    departmentName: u.department.name,
  };
});

/** For Server Actions and Route Handlers. */
export async function requireActor(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** For pages: sends anonymous visitors to the login page. */
export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
