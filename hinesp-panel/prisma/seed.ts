/**
 * Idempotent seed: departments, the first Super Admin, and (optionally) sample users.
 * Run with `npm run db:seed`. Existing users are never modified.
 */
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

const DEPARTMENTS: { name: string; slug: string }[] = [
  { name: "مدیران", slug: "management" },
  { name: "برنامه‌نویسی", slug: "dev" },
  { name: "طراحی", slug: "design" },
  { name: "مارکتینگ", slug: "marketing" },
  { name: "استراتژی", slug: "strategy" },
  { name: "حسابداری", slug: "accounting" },
];

async function ensureUser(username: string, fullName: string, departmentId: string, roles: Role[], password: string) {
  const exists = await db.user.findUnique({ where: { username } });
  if (exists) return false;
  await db.user.create({
    data: { username, fullName, departmentId, roles, passwordHash: await bcrypt.hash(password, 12) },
  });
  return true;
}

async function main() {
  const adminUsername = (process.env.SEED_ADMIN_USERNAME || "admin").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be set (8+ characters).");
  }

  const deps: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const row = await db.department.upsert({ where: { name: d.name }, update: {}, create: { name: d.name } });
    deps[d.slug] = row.id;
  }

  const created: string[] = [];
  if (await ensureUser(adminUsername, "مدیر سیستم", deps.management!, ["SUPER_ADMIN"], adminPassword)) {
    created.push(adminUsername);
  }

  const samplePassword = process.env.SEED_SAMPLE_PASSWORD;
  if (samplePassword) {
    for (const d of DEPARTMENTS) {
      if (await ensureUser(`${d.slug}.manager`, `مدیر ${d.name}`, deps[d.slug]!, ["MANAGER"], samplePassword)) {
        created.push(`${d.slug}.manager`);
      }
      if (await ensureUser(`${d.slug}.employee`, `کارمند ${d.name}`, deps[d.slug]!, ["EMPLOYEE"], samplePassword)) {
        created.push(`${d.slug}.employee`);
      }
    }
    if (await ensureUser("dev.pa", "مدیر پروژه برنامه‌نویسی", deps.dev!, ["PROJECT_ADMIN", "EMPLOYEE"], samplePassword)) {
      created.push("dev.pa");
    }
  }

  console.log(created.length ? `Created users: ${created.join(", ")}` : "Nothing new to create.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
