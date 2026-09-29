"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  try {
    await signIn("credentials", {
      username,
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "rate_limited") return { username, error: "به دلیل تلاش‌های ناموفق زیاد، ورود موقتاً مسدود شد. ۱۵ دقیقه بعد دوباره تلاش کنید." };
      return { username, error: "نام کاربری یا رمز عبور نادرست است." };
    }
    throw e; // Next.js redirect after a successful sign-in
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
