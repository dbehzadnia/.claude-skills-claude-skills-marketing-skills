/**
 * Central authorization module. Every Server Action, Route Handler, page and
 * service decides access through these functions only.
 *
 * Roles:
 * - SUPER_ADMIN:   everything.
 * - MANAGER:       all projects, assigns Project Admins, all reports, product dashboards,
 *                  decides leave requests of their own department.
 * - PROJECT_ADMIN: manages phases, tasks and members of projects they administer.
 * - EMPLOYEE:      only projects they are a member of.
 */
import type { Role } from "@prisma/client";
import { ForbiddenError } from "./errors";

export type Actor = {
  id: string;
  roles: Role[];
  departmentId: string;
};

export type Permission =
  | "user.manage"
  | "department.manage"
  | "settings.manage"
  | "integration.manage"
  | "audit.view"
  | "project.create"
  | "project.viewAll"
  | "project.assignAdmin"
  | "report.view"
  | "product.view"
  | "leave.decide";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: [
    "user.manage",
    "department.manage",
    "settings.manage",
    "integration.manage",
    "audit.view",
    "project.create",
    "project.viewAll",
    "project.assignAdmin",
    "report.view",
    "product.view",
    "leave.decide",
  ],
  MANAGER: [
    "project.create",
    "project.viewAll",
    "project.assignAdmin",
    "report.view",
    "product.view",
    "leave.decide",
  ],
  PROJECT_ADMIN: [],
  EMPLOYEE: [],
};

export function hasRole(actor: Actor, role: Role): boolean {
  return actor.roles.includes(role);
}

export function isSuperAdmin(actor: Actor): boolean {
  return hasRole(actor, "SUPER_ADMIN");
}

export function can(actor: Actor, permission: Permission): boolean {
  return actor.roles.some((r) => ROLE_PERMISSIONS[r].includes(permission));
}

export function assertCan(actor: Actor, permission: Permission): void {
  if (!can(actor, permission)) throw new ForbiddenError();
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new ForbiddenError(message);
}

// ─── Project-scoped rules ──────────────────────────────────────────────

/** The minimum a project check needs: who administers it and whether the actor is a member. */
export type ProjectAccessContext = {
  adminId: string | null;
  isMember: boolean;
};

/** Users who may be set as a project's admin. */
export function canBeProjectAdmin(roles: Role[]): boolean {
  return roles.some((r) => r === "PROJECT_ADMIN" || r === "MANAGER" || r === "SUPER_ADMIN");
}

export function canViewProject(actor: Actor, p: ProjectAccessContext): boolean {
  return can(actor, "project.viewAll") || p.adminId === actor.id || p.isMember;
}

/** Edit project details, phases, tasks and members. */
export function canManageProject(actor: Actor, p: ProjectAccessContext): boolean {
  if (isSuperAdmin(actor) || hasRole(actor, "MANAGER")) return true;
  return hasRole(actor, "PROJECT_ADMIN") && p.adminId === actor.id;
}

/** Members may move their own assigned tasks and comment; managers of the project may do anything. */
export function canUpdateTaskStatus(
  actor: Actor,
  p: ProjectAccessContext,
  assigneeIds: string[],
): boolean {
  return canManageProject(actor, p) || (p.isMember && assigneeIds.includes(actor.id));
}

export function canCommentOnTask(actor: Actor, p: ProjectAccessContext): boolean {
  return canManageProject(actor, p) || p.isMember;
}

/** Chat is strictly for members of the project (its admin is always a member). */
export function canAccessProjectChat(p: ProjectAccessContext, actor: Actor): boolean {
  return p.isMember || p.adminId === actor.id;
}

// ─── Leave ─────────────────────────────────────────────────────────────

/**
 * Super Admin decides any request. A Manager decides requests from their own
 * department. Nobody decides their own request.
 */
export function canDecideLeave(
  actor: Actor,
  request: { userId: string; departmentId: string },
): boolean {
  if (request.userId === actor.id) return false;
  if (isSuperAdmin(actor)) return true;
  return hasRole(actor, "MANAGER") && actor.departmentId === request.departmentId;
}
