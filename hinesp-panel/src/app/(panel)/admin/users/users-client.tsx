"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS } from "@/lib/labels";
import { createUserAction, resetPasswordAction, updateUserAction } from "@/server/actions/users";

type Dept = { id: string; name: string };
type UserRow = {
  id: string;
  username: string;
  fullName: string;
  roles: Role[];
  active: boolean;
  departmentId: string;
  department: { name: string };
};

const ALL_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "PROJECT_ADMIN", "EMPLOYEE"];

function RolesField({ value, onChange }: { value: Role[]; onChange: (r: Role[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">نقش‌ها</legend>
      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLES.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(r)}
              onChange={(e) => onChange(e.target.checked ? [...value, r] : value.filter((x) => x !== r))}
            />
            {ROLE_LABELS[r]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CreateUserButton({ departments }: { departments: Dept[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [roles, setRoles] = useState<Role[]>(["EMPLOYEE"]);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(fd: FormData) {
    setError(undefined);
    start(async () => {
      const res = await createUserAction({
        username: String(fd.get("username")),
        fullName: String(fd.get("fullName")),
        departmentId: String(fd.get("departmentId")),
        password: String(fd.get("password")),
        roles,
      });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      setRoles(["EMPLOYEE"]);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>کاربر جدید</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>کاربر جدید</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">نام و نام خانوادگی</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input id="username" name="username" dir="ltr" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">رمز عبور اولیه</Label>
            <Input id="password" name="password" type="password" dir="ltr" minLength={8} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="departmentId">دپارتمان</Label>
            <NativeSelect id="departmentId" name="departmentId" required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <RolesField value={roles} onChange={setRoles} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            ذخیره
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, departments, onClose }: { user: UserRow; departments: Dept[]; onClose: () => void }) {
  const [roles, setRoles] = useState<Role[]>(user.roles);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(fd: FormData) {
    setError(undefined);
    start(async () => {
      const res = await updateUserAction({
        id: user.id,
        fullName: String(fd.get("fullName")),
        departmentId: String(fd.get("departmentId")),
        active: fd.get("active") === "on",
        roles,
      });
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویرایش {user.fullName}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="e-fullName">نام و نام خانوادگی</Label>
            <Input id="e-fullName" name="fullName" defaultValue={user.fullName} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="e-departmentId">دپارتمان</Label>
            <NativeSelect id="e-departmentId" name="departmentId" defaultValue={user.departmentId}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <RolesField value={roles} onChange={setRoles} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={user.active} />
            حساب فعال است
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            ذخیره
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(undefined);
    start(async () => {
      const res = await resetPasswordAction(user.id, String(fd.get("password")));
      if (!res.ok) return setError(res.error);
      setDone(true);
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بازنشانی رمز {user.fullName}</DialogTitle>
        </DialogHeader>
        {done ? (
          <p className="text-sm">رمز جدید ثبت شد. کاربر از همه دستگاه‌ها خارج شد.</p>
        ) : (
          <form action={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r-password">رمز جدید</Label>
              <Input id="r-password" name="password" type="password" dir="ltr" minLength={8} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>
              ثبت رمز جدید
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable({ users, departments, currentUserId }: { users: UserRow[]; departments: Dept[]; currentUserId: string }) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نام</TableHead>
            <TableHead>نام کاربری</TableHead>
            <TableHead>دپارتمان</TableHead>
            <TableHead>نقش‌ها</TableHead>
            <TableHead>وضعیت</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="whitespace-nowrap">{u.fullName}</TableCell>
              <TableCell className="ltr text-end">{u.username}</TableCell>
              <TableCell className="whitespace-nowrap">{u.department.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant="secondary">
                      {ROLE_LABELS[r]}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{u.active ? <Badge variant="success">فعال</Badge> : <Badge variant="destructive">غیرفعال</Badge>}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                    ویرایش
                  </Button>
                  {u.id !== currentUserId && (
                    <Button size="sm" variant="ghost" onClick={() => setResetting(u)}>
                      بازنشانی رمز
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                کاربری پیدا نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {editing && <EditUserDialog user={editing} departments={departments} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
