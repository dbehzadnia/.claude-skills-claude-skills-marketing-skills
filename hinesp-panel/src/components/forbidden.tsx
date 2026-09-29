export function Forbidden() {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h1 className="mb-2 text-lg font-bold">دسترسی ندارید</h1>
      <p className="text-sm text-muted-foreground">شما اجازه دیدن این صفحه را ندارید.</p>
    </div>
  );
}
