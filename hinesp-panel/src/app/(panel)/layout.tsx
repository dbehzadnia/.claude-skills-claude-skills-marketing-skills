import { AppShell } from "@/components/shell/app-shell";
import { navFor } from "@/components/shell/nav";
import { requirePageUser } from "@/server/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <AppShell nav={navFor(user)} user={{ fullName: user.fullName, departmentName: user.departmentName }}>
      {children}
    </AppShell>
  );
}
