"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">نام کاربری</Label>
        <Input id="username" name="username" autoComplete="username" dir="ltr" defaultValue={state.username} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "در حال ورود…" : "ورود"}
      </Button>
    </form>
  );
}
