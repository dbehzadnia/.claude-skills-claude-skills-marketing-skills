import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import {
  can,
  canAccessProjectChat,
  canBeProjectAdmin,
  canDecideLeave,
  canManageProject,
  canUpdateTaskStatus,
  canViewProject,
  type Actor,
  type Permission,
} from "@/server/authz";

const actor = (roles: Role[], id = "me", departmentId = "d1"): Actor => ({ id, roles, departmentId });

const SA = actor(["SUPER_ADMIN"]);
const MGR = actor(["MANAGER"]);
const PA = actor(["PROJECT_ADMIN"]);
const EMP = actor(["EMPLOYEE"]);

describe("role permissions", () => {
  const table: [Permission, boolean, boolean, boolean, boolean][] = [
    // permission              SA     MGR    PA     EMP
    ["user.manage", true, false, false, false],
    ["department.manage", true, false, false, false],
    ["settings.manage", true, false, false, false],
    ["integration.manage", true, false, false, false],
    ["audit.view", true, false, false, false],
    ["project.create", true, true, false, false],
    ["project.viewAll", true, true, false, false],
    ["project.assignAdmin", true, true, false, false],
    ["report.view", true, true, false, false],
    ["product.view", true, true, false, false],
    ["leave.decide", true, true, false, false],
  ];
  it.each(table)("%s", (perm, sa, mgr, pa, emp) => {
    expect(can(SA, perm)).toBe(sa);
    expect(can(MGR, perm)).toBe(mgr);
    expect(can(PA, perm)).toBe(pa);
    expect(can(EMP, perm)).toBe(emp);
  });

  it("combines roles", () => {
    expect(can(actor(["EMPLOYEE", "MANAGER"]), "report.view")).toBe(true);
  });

  it("no roles means no access", () => {
    expect(can(actor([]), "project.create")).toBe(false);
  });
});

describe("project access", () => {
  const own = { adminId: "me", isMember: true };
  const other = { adminId: "someone", isMember: false };
  const memberOnly = { adminId: "someone", isMember: true };

  it("view: managers see all, others only their projects", () => {
    expect(canViewProject(SA, other)).toBe(true);
    expect(canViewProject(MGR, other)).toBe(true);
    expect(canViewProject(PA, other)).toBe(false);
    expect(canViewProject(EMP, other)).toBe(false);
    expect(canViewProject(EMP, memberOnly)).toBe(true);
    expect(canViewProject(PA, own)).toBe(true);
  });

  it("manage: Project Admin only on their own projects", () => {
    expect(canManageProject(SA, other)).toBe(true);
    expect(canManageProject(MGR, other)).toBe(true);
    expect(canManageProject(PA, own)).toBe(true);
    expect(canManageProject(PA, memberOnly)).toBe(false);
    expect(canManageProject(EMP, own)).toBe(false); // admin field without the role is not enough
    expect(canManageProject(EMP, memberOnly)).toBe(false);
  });

  it("task status: members only on tasks assigned to them", () => {
    expect(canUpdateTaskStatus(EMP, memberOnly, ["me"])).toBe(true);
    expect(canUpdateTaskStatus(EMP, memberOnly, ["x"])).toBe(false);
    expect(canUpdateTaskStatus(EMP, other, ["me"])).toBe(false);
    expect(canUpdateTaskStatus(PA, own, [])).toBe(true);
  });

  it("chat: members and the project admin only — not managers by role", () => {
    expect(canAccessProjectChat(memberOnly, EMP)).toBe(true);
    expect(canAccessProjectChat(other, EMP)).toBe(false);
    expect(canAccessProjectChat(other, SA)).toBe(false);
    expect(canAccessProjectChat(other, MGR)).toBe(false);
    expect(canAccessProjectChat({ adminId: "me", isMember: false }, PA)).toBe(true);
  });

  it("only PA, Manager or Super Admin can be a project admin", () => {
    expect(canBeProjectAdmin(["EMPLOYEE"])).toBe(false);
    expect(canBeProjectAdmin(["EMPLOYEE", "PROJECT_ADMIN"])).toBe(true);
    expect(canBeProjectAdmin(["MANAGER"])).toBe(true);
  });
});

describe("leave decisions", () => {
  it("manager decides own department only, never own request", () => {
    expect(canDecideLeave(MGR, { userId: "u2", departmentId: "d1" })).toBe(true);
    expect(canDecideLeave(MGR, { userId: "u2", departmentId: "d2" })).toBe(false);
    expect(canDecideLeave(MGR, { userId: "me", departmentId: "d1" })).toBe(false);
  });
  it("super admin decides any department", () => {
    expect(canDecideLeave(SA, { userId: "u2", departmentId: "d9" })).toBe(true);
    expect(canDecideLeave(SA, { userId: "me", departmentId: "d1" })).toBe(false);
  });
  it("project admin and employee cannot decide", () => {
    expect(canDecideLeave(PA, { userId: "u2", departmentId: "d1" })).toBe(false);
    expect(canDecideLeave(EMP, { userId: "u2", departmentId: "d1" })).toBe(false);
  });
});
