import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "مدیر کل",
  MANAGER: "مدیر",
  PROJECT_ADMIN: "مدیر پروژه",
  EMPLOYEE: "کارمند",
};
