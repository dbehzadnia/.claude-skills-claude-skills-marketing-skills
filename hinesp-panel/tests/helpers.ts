import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import type { Actor } from "@/server/authz";

/** Empty every table (except Prisma's migration table) between tests. */
export async function resetDb() {
  const rows = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const list = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let seq = 0;

export async function makeDepartment(name = `dep-${++seq}`) {
  return db.department.create({ data: { name } });
}

/** Create a user and return it as an Actor. The password hash is a dummy unless given. */
export async function makeUser(
  roles: Role[],
  opts: { departmentId?: string; username?: string; passwordHash?: string } = {},
): Promise<Actor & { username: string }> {
  const departmentId = opts.departmentId ?? (await makeDepartment()).id;
  const u = await db.user.create({
    data: {
      username: opts.username ?? `user${++seq}`,
      fullName: `User ${seq}`,
      roles,
      departmentId,
      passwordHash: opts.passwordHash ?? "x",
    },
  });
  return { id: u.id, roles: u.roles, departmentId: u.departmentId, username: u.username };
}
