import { ZodError } from "zod";
import { AppError } from "./errors";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export function toActionError(e: unknown): { ok: false; error: string } {
  if (e instanceof AppError) return { ok: false, error: e.message };
  if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "ورودی نامعتبر است." };
  console.error(e);
  return { ok: false, error: "خطای غیرمنتظره رخ داد." };
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return toActionError(e);
  }
}
