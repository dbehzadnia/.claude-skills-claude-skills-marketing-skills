import type { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { assertCan, type Actor } from "../authz";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { hashPassword, passwordSchema, verifyPassword } from "../password";
import { normalizePage, paged } from "@/lib/pagination";
import { normalizeUsername } from "./auth";

export const ROLES = ["SUPER_ADMIN", "MANAGER", "PROJECT_ADMIN", "EMPLOYEE"] as const satisfies readonly Role[];

export const userSelect = {
  id: true,
  username: true,
  fullName: true,
  roles: true,
  active: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "نام کاربری حداقل ۳ کاراکتر است.")
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, "نام کاربری فقط حروف انگلیسی، عدد، نقطه، خط تیره و زیرخط."),
  fullName: z.string().trim().min(2, "نام را وارد کنید.").max(100),
  departmentId: z.string().min(1, "دپارتمان را انتخاب کنید."),
  roles: z.array(z.enum(ROLES)).min(1, "حداقل یک نقش انتخاب کنید."),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().trim().min(2).max(100),
  departmentId: z.string().min(1),
  roles: z.array(z.enum(ROLES)).min(1, "حداقل یک نقش انتخاب کنید."),
  active: z.boolean(),
});

export async function listUsers(
  actor: Actor,
  opts: { page?: number; pageSize?: number; q?: string; departmentId?: string } = {},
) {
  assertCan(actor, "user.manage");
  const { page, pageSize, skip, take } = normalizePage(opts.page, opts.pageSize);
  const where: Prisma.UserWhereInput = {
    ...(opts.departmentId ? { departmentId: opts.departmentId } : {}),
    ...(opts.q
      ? {
          OR: [
            { username: { contains: opts.q, mode: "insensitive" } },
            { fullName: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, select: userSelect, orderBy: { createdAt: "asc" }, skip, take }),
    db.user.count({ where }),
  ]);
  return paged(items, total, page, pageSize);
}

/** Small list for pickers (assignees, members, project admin). Any signed-in user may read names. */
export async function searchUsers(_actor: Actor, q: string, limit = 20) {
  return db.user.findMany({
    where: {
      active: true,
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, username: true, fullName: true, roles: true, departmentId: true },
    orderBy: { fullName: "asc" },
    take: Math.min(limit, 50),
  });
}

export async function createUser(actor: Actor, input: z.input<typeof createUserSchema>) {
  assertCan(actor, "user.manage");
  const data = createUserSchema.parse(input);
  const username = normalizeUsername(data.username);
  const exists = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (exists) throw new ConflictError("این نام کاربری قبلاً ثبت شده است.");
  await ensureDepartment(data.departmentId);
  const passwordHash = await hashPassword(data.password);
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        fullName: data.fullName,
        departmentId: data.departmentId,
        roles: uniqueRoles(data.roles),
        passwordHash,
      },
      select: userSelect,
    });
    await audit(
      { actorId: actor.id, action: "CREATE", entity: "user", entityId: user.id, summary: `ایجاد کاربر ${username}`, data: { roles: user.roles } },
      tx,
    );
    return user;
  });
}

export async function updateUser(actor: Actor, input: z.input<typeof updateUserSchema>) {
  assertCan(actor, "user.manage");
  const data = updateUserSchema.parse(input);
  const current = await db.user.findUnique({ where: { id: data.id }, select: { id: true, roles: true, active: true, username: true } });
  if (!current) throw new NotFoundError("کاربر پیدا نشد.");
  if (data.id === actor.id && (!data.active || !data.roles.includes("SUPER_ADMIN"))) {
    throw new ValidationError("نمی‌توانید دسترسی مدیر کل را از خودتان بگیرید.");
  }
  await ensureDepartment(data.departmentId);
  const roles = uniqueRoles(data.roles);
  const accessChanged = current.active !== data.active || current.roles.join() !== roles.join();
  return db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName,
        departmentId: data.departmentId,
        roles,
        active: data.active,
        ...(accessChanged ? { tokenVersion: { increment: 1 } } : {}),
      },
      select: userSelect,
    });
    await audit(
      {
        actorId: actor.id,
        action: "UPDATE",
        entity: "user",
        entityId: user.id,
        summary: `ویرایش کاربر ${current.username}`,
        data: { roles, active: data.active, departmentId: data.departmentId },
      },
      tx,
    );
    return user;
  });
}

/** Super Admin sets a new password; the user's existing sessions stop working. */
export async function resetPassword(actor: Actor, userId: string, newPassword: string) {
  assertCan(actor, "user.manage");
  const password = passwordSchema.parse(newPassword);
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, username: true } });
  if (!user) throw new NotFoundError("کاربر پیدا نشد.");
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash, tokenVersion: { increment: 1 } } });
    await audit(
      { actorId: actor.id, action: "UPDATE", entity: "user", entityId: userId, summary: `بازنشانی رمز ${user.username}` },
      tx,
    );
  });
}

export async function changeOwnPassword(actor: Actor, currentPassword: string, newPassword: string) {
  const password = passwordSchema.parse(newPassword);
  const user = await db.user.findUnique({ where: { id: actor.id }, select: { passwordHash: true } });
  if (!user) throw new NotFoundError("کاربر پیدا نشد.");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ValidationError("رمز فعلی درست نیست.");
  }
  // tokenVersion is not bumped here so the user stays signed in on this device.
  await db.user.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(password) } });
}

async function ensureDepartment(id: string) {
  const d = await db.department.findUnique({ where: { id }, select: { id: true } });
  if (!d) throw new ValidationError("دپارتمان معتبر نیست.");
}

function uniqueRoles(roles: Role[]): Role[] {
  return ROLES.filter((r) => roles.includes(r));
}
