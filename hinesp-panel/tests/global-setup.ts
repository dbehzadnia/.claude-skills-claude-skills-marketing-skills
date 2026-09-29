// Runs once before all tests: bring the test database up to the latest migration.
// Each test file empties the tables itself (see resetDb in helpers.ts).
import { execSync } from "node:child_process";
import fs from "node:fs";

export default function setup() {
  if (fs.existsSync(".env")) process.loadEnvFile(".env");
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  if (url === process.env.DATABASE_URL) throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL");
  // Safety net: tests truncate every table, so refuse anything that doesn't look like a test database.
  const dbName = new URL(url).pathname.slice(1);
  if (!/test/i.test(dbName)) throw new Error(`Refusing to run tests on "${dbName}": the name must contain "test".`);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}
