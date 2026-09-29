import { PageHeader } from "@/components/page-header";
import { requirePageUser } from "@/server/session";
import { ChangePasswordForm } from "./password-form";

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title="حساب کاربری" description={`${user.fullName} — ${user.username}`} />
      <ChangePasswordForm />
    </>
  );
}
