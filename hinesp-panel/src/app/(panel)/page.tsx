import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJalali } from "@/lib/jalali";
import { ROLE_LABELS } from "@/lib/labels";
import { requirePageUser } from "@/server/session";

export default async function DashboardPage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title={`سلام، ${user.fullName}`} description={formatJalali(new Date(), "EEEE d MMMM yyyy")} />
      <Card>
        <CardHeader>
          <CardTitle>حساب شما</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          دپارتمان: {user.departmentName} — نقش: {user.roles.map((r) => ROLE_LABELS[r]).join("، ")}
        </CardContent>
      </Card>
    </>
  );
}
