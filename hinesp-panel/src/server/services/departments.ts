import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { assertCan, type Actor } from "../authz";
import { ConflictError, NotFoundError, ValidationError } from "../errors";

export const DEFAULT_DEPARTMENTS = ["مدیران", "برنامه‌نویسی", "طراحی", "مارکتینگ", "استراتژی", "حسابداری"];

const nameSchema = z.string().trim().min(2, "نام دپارتمان را وارد کنید.").max(60);

/** Any signed-in user can read department names (used in filters and forms). */
export async function listDepartments() {
  const rows = await db.department.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, _count: { select: { users: true } } },
  });
  return rows.map((d) => ({ id: d.id, name: d.name, userCount: d._count.users }));
}

export async function createDepartment(actor: Actor, rawName: string) {
  assertCan(actor, "department.manage");
  const name = nameSchema.parse(rawName);
  if (await db.department.findUnique({ where: { name } })) throw new ConflictError("این دپارتمان وجود دارد.");
  return db.$transaction(async (tx) => {
    const d = await tx.department.create({ data: { name } });
    await audit({ actorId: actor.id, action: "CREATE", entity: "department", entityId: d.id, summary: `ایجاد دپارتمان ${name}` }, tx);
    return d;
  });
}

export async function renameDepartment(actor: Actor, id: string, rawName: string) {
  assertCan(actor, "department.manage");
  const name = nameSchema.parse(rawName);
  const d = await db.department.findUnique({ where: { id } });
  if (!d) throw new NotFoundError();
  const clash = await db.department.findUnique({ where: { name } });
  if (clash && clash.id !== id) throw new ConflictError("این نام تکراری است.");
  return db.$transaction(async (tx) => {
    const updated = await tx.department.update({ where: { id }, data: { name } });
    await audit(
      { actorId: actor.id, action: "UPDATE", entity: "department", entityId: id, summary: `تغییر نام دپارتمان ${d.name} به ${name}` },
      tx,
    );
    return updated;
  });
}

export async function deleteDepartment(actor: Actor, id: string) {
  assertCan(actor, "department.manage");
  const d = await db.department.findUnique({ where: { id }, select: { name: true, _count: { select: { users: true } } } });
  if (!d) throw new NotFoundError();
  if (d._count.users > 0) throw new ValidationError("این دپارتمان کاربر دارد و حذف نمی‌شود.");
  await db.$transaction(async (tx) => {
    await tx.department.delete({ where: { id } });
    await audit({ actorId: actor.id, action: "DELETE", entity: "department", entityId: id, summary: `حذف دپارتمان ${d.name}` }, tx);
  });
}
