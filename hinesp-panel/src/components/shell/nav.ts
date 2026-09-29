import { can, type Actor } from "@/server/authz";

export type NavIcon =
  | "home"
  | "projects"
  | "tasks"
  | "attendance"
  | "leave"
  | "reports"
  | "products"
  | "users"
  | "departments"
  | "settings"
  | "audit"
  | "account";

export type NavItem = { href: string; label: string; icon: NavIcon };
export type NavGroup = { title?: string; items: NavItem[] };

/** Menu for the current user. Hiding links is cosmetic; every page checks access on the server. */
export function navFor(actor: Actor): NavGroup[] {
  const main: NavItem[] = [{ href: "/", label: "داشبورد", icon: "home" }];

  const admin: NavItem[] = [];
  if (can(actor, "user.manage")) admin.push({ href: "/admin/users", label: "کاربران", icon: "users" });
  if (can(actor, "department.manage")) admin.push({ href: "/admin/departments", label: "دپارتمان‌ها", icon: "departments" });

  const groups: NavGroup[] = [{ items: main }];
  if (admin.length) groups.push({ title: "مدیریت", items: admin });
  groups.push({ items: [{ href: "/account", label: "حساب کاربری", icon: "account" }] });
  return groups;
}
