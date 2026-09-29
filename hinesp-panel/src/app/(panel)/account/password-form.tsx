"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPasswordAction } from "@/server/actions/users";

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(fd: FormData) {
    const next = String(fd.get("next"));
    if (next !== String(fd.get("confirm"))) return setMsg({ ok: false, text: "تکرار رمز جدید یکسان نیست." });
    start(async () => {
      const res = await changeOwnPasswordAction(String(fd.get("current")), next);
      if (!res.ok) return setMsg({ ok: false, text: res.error });
      formRef.current?.reset();
      setMsg({ ok: true, text: "رمز عبور تغییر کرد." });
    });
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>تغییر رمز عبور</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current">رمز فعلی</Label>
            <Input id="current" name="current" type="password" dir="ltr" autoComplete="current-password" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="next">رمز جدید</Label>
            <Input id="next" name="next" type="password" dir="ltr" minLength={8} autoComplete="new-password" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">تکرار رمز جدید</Label>
            <Input id="confirm" name="confirm" type="password" dir="ltr" minLength={8} autoComplete="new-password" required />
          </div>
          {msg && <p className={msg.ok ? "text-sm text-success" : "text-sm text-destructive"}>{msg.text}</p>}
          <Button type="submit" disabled={pending}>
            تغییر رمز
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
