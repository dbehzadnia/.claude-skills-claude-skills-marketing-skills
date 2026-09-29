"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toFaDigits } from "@/lib/digits";
import { createDepartmentAction, deleteDepartmentAction, renameDepartmentAction } from "@/server/actions/users";

type Dept = { id: string; name: string; userCount: number };

export function DepartmentsClient({ departments }: { departments: Dept[] }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(undefined);
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <form
        action={(fd) => run(() => createDepartmentAction(String(fd.get("name"))))}
        className="flex gap-2"
      >
        <Input name="name" placeholder="نام دپارتمان جدید" required />
        <Button disabled={pending}>افزودن</Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="divide-y rounded-lg border bg-card">
        {departments.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-2 p-3">
            <form
              action={(fd) => run(() => renameDepartmentAction(d.id, String(fd.get("name"))))}
              className="flex flex-1 gap-2"
            >
              <Input name="name" defaultValue={d.name} className="min-w-0" />
              <Button size="sm" variant="outline" disabled={pending}>
                ذخیره
              </Button>
            </form>
            <span className="text-xs text-muted-foreground">{toFaDigits(d.userCount)} نفر</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending || d.userCount > 0}
              onClick={() => {
                if (confirm(`دپارتمان «${d.name}» حذف شود؟`)) run(() => deleteDepartmentAction(d.id));
              }}
            >
              حذف
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
