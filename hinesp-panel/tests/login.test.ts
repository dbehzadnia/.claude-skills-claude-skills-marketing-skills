import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { hashPassword } from "@/server/password";
import { MAX_FAILED_PER_USERNAME } from "@/server/rate-limit";
import { verifyLogin } from "@/server/services/auth";
import { makeUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("login", () => {
  it("accepts correct credentials (username is case-insensitive)", async () => {
    await makeUser(["EMPLOYEE"], { username: "sara", passwordHash: await hashPassword("secret123") });
    const res = await verifyLogin("  SARA ", "secret123", "1.1.1.1");
    expect(res.status).toBe("ok");
  });

  it("rejects wrong password and inactive users", async () => {
    const u = await makeUser(["EMPLOYEE"], { username: "reza", passwordHash: await hashPassword("secret123") });
    expect((await verifyLogin("reza", "nope", "1.1.1.1")).status).toBe("invalid");
    await db.user.update({ where: { id: u.id }, data: { active: false } });
    expect((await verifyLogin("reza", "secret123", "1.1.1.1")).status).toBe("invalid");
  });

  it("blocks after too many failures, even with the right password", async () => {
    await makeUser(["EMPLOYEE"], { username: "mina", passwordHash: await hashPassword("secret123") });
    for (let i = 0; i < MAX_FAILED_PER_USERNAME; i++) {
      expect((await verifyLogin("mina", "bad", "2.2.2.2")).status).toBe("invalid");
    }
    expect((await verifyLogin("mina", "secret123", "3.3.3.3")).status).toBe("blocked");
  });

  it("failures older than the window don't count", async () => {
    await makeUser(["EMPLOYEE"], { username: "omid", passwordHash: await hashPassword("secret123") });
    const old = new Date(Date.now() - 16 * 60 * 1000);
    await db.loginAttempt.createMany({
      data: Array.from({ length: MAX_FAILED_PER_USERNAME }, () => ({ username: "omid", ip: "x", success: false, createdAt: old })),
    });
    expect((await verifyLogin("omid", "secret123", "x")).status).toBe("ok");
  });

  it("unknown usernames are recorded as failures too", async () => {
    await verifyLogin("ghost", "x", "9.9.9.9");
    expect(await db.loginAttempt.count({ where: { username: "ghost", success: false } })).toBe(1);
  });
});
