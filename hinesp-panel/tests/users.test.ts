import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import { changeOwnPassword, createUser, listUsers, resetPassword, updateUser } from "@/server/services/users";
import { createDepartment, deleteDepartment } from "@/server/services/departments";
import { hashPassword, verifyPassword } from "@/server/password";
import { makeDepartment, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("user management authorization", () => {
  it("only Super Admin can list and create users", async () => {
    const dep = await makeDepartment();
    const input = { username: "new.user", fullName: "کاربر جدید", departmentId: dep.id, roles: ["EMPLOYEE" as const], password: "password1" };
    for (const roles of [["MANAGER"], ["PROJECT_ADMIN"], ["EMPLOYEE"]] as const) {
      const a = await makeUser([...roles]);
      await expect(listUsers(a)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(createUser(a, input)).rejects.toBeInstanceOf(ForbiddenError);
    }
    const sa = await makeUser(["SUPER_ADMIN"]);
    const u = await createUser(sa, input);
    expect(u.username).toBe("new.user");
    expect(await db.auditLog.count({ where: { entity: "user", entityId: u.id, action: "CREATE" } })).toBe(1);
  });

  it("rejects duplicate usernames case-insensitively", async () => {
    const sa = await makeUser(["SUPER_ADMIN"]);
    const dep = await makeDepartment();
    const input = { username: "Ali", fullName: "علی", departmentId: dep.id, roles: ["EMPLOYEE" as const], password: "password1" };
    await createUser(sa, input);
    await expect(createUser(sa, { ...input, username: "ali" })).rejects.toThrow("قبلاً");
  });

  it("changing roles or deactivating bumps tokenVersion (signs the user out)", async () => {
    const sa = await makeUser(["SUPER_ADMIN"]);
    const emp = await makeUser(["EMPLOYEE"]);
    await updateUser(sa, { id: emp.id, fullName: "x y", departmentId: emp.departmentId, roles: ["EMPLOYEE", "MANAGER"], active: true });
    expect((await db.user.findUniqueOrThrow({ where: { id: emp.id } })).tokenVersion).toBe(1);
  });

  it("Super Admin cannot remove their own super admin role", async () => {
    const sa = await makeUser(["SUPER_ADMIN"]);
    await expect(
      updateUser(sa, { id: sa.id, fullName: "x y", departmentId: sa.departmentId, roles: ["MANAGER"], active: true }),
    ).rejects.toThrow();
  });

  it("password reset is Super Admin only and invalidates sessions", async () => {
    const sa = await makeUser(["SUPER_ADMIN"]);
    const mgr = await makeUser(["MANAGER"]);
    const emp = await makeUser(["EMPLOYEE"]);
    await expect(resetPassword(mgr, emp.id, "newpassword")).rejects.toBeInstanceOf(ForbiddenError);
    await resetPassword(sa, emp.id, "newpassword");
    const row = await db.user.findUniqueOrThrow({ where: { id: emp.id } });
    expect(await verifyPassword("newpassword", row.passwordHash)).toBe(true);
    expect(row.tokenVersion).toBe(1);
  });

  it("users change their own password only with the current one", async () => {
    const emp = await makeUser(["EMPLOYEE"], { passwordHash: await hashPassword("oldpassword") });
    await expect(changeOwnPassword(emp, "wrong", "newpassword")).rejects.toThrow("رمز فعلی");
    await changeOwnPassword(emp, "oldpassword", "newpassword");
    const row = await db.user.findUniqueOrThrow({ where: { id: emp.id } });
    expect(await verifyPassword("newpassword", row.passwordHash)).toBe(true);
  });
});

describe("departments", () => {
  it("only Super Admin edits departments; non-empty ones cannot be deleted", async () => {
    const mgr = await makeUser(["MANAGER"]);
    await expect(createDepartment(mgr, "تست")).rejects.toBeInstanceOf(ForbiddenError);
    const sa = await makeUser(["SUPER_ADMIN"]);
    const d = await createDepartment(sa, "تست");
    await makeUser(["EMPLOYEE"], { departmentId: d.id });
    await expect(deleteDepartment(sa, d.id)).rejects.toThrow("کاربر دارد");
  });
});
