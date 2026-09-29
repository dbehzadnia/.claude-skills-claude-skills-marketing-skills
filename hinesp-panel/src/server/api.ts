import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/** Wrap a Route Handler body: maps service errors to JSON responses. */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message ?? "ورودی نامعتبر است." }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "خطای داخلی" }, { status: 500 });
  }
}
