// Runs in every test worker: point Prisma at the test database (never the real one).
import fs from "node:fs";

if (fs.existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
process.env.CRON_SECRET ||= "test-cron-secret";
process.env.STORAGE_DRIVER = "local";
process.env.LOCAL_UPLOAD_DIR = "./.test-uploads";
