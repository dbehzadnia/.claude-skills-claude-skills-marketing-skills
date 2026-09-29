import { Forbidden } from "@/components/forbidden";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { can } from "@/server/authz";
import { listDepartments } from "@/server/services/departments";
import { listUsers } from "@/server/services/users";
import { requirePageUser } from "@/server/session";
import { UsersTable, CreateUserButton } from "./users-client";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function UsersPage({ searchParams }: { searchParams: SP }) {
  const user = await requirePageUser();
  if (!can(user, "user.manage")) return <Forbidden />;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [result, departments] = await Promise.all([
    listUsers(user, { page: Number(sp.page) || 1, q }),
    listDepartments(),
  ]);
  const deps = departments.map((d) => ({ id: d.id, name: d.name }));
  return (
    <>
      <PageHeader title="کاربران" actions={<CreateUserButton departments={deps} />} />
      <form className="mb-3 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجوی نام یا نام کاربری"
          className="h-9 w-full max-w-xs rounded-md border border-input bg-card px-3 text-sm"
        />
        <button className="rounded-md border px-3 text-sm hover:bg-muted">جستجو</button>
      </form>
      <UsersTable
        users={result.items.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        departments={deps}
        currentUserId={user.id}
      />
      <Pagination page={result.page} pageCount={result.pageCount} searchParams={sp} basePath="/admin/users" />
    </>
  );
}
