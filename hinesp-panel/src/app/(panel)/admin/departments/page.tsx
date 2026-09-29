import { Forbidden } from "@/components/forbidden";
import { PageHeader } from "@/components/page-header";
import { can } from "@/server/authz";
import { listDepartments } from "@/server/services/departments";
import { requirePageUser } from "@/server/session";
import { DepartmentsClient } from "./departments-client";

export default async function DepartmentsPage() {
  const user = await requirePageUser();
  if (!can(user, "department.manage")) return <Forbidden />;
  const departments = await listDepartments();
  return (
    <>
      <PageHeader title="دپارتمان‌ها" />
      <DepartmentsClient departments={departments} />
    </>
  );
}
