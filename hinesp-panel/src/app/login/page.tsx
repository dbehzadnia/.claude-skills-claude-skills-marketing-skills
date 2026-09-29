import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <h1 className="mb-1 text-xl font-bold">پنل داخلی هاینسپ</h1>
        <p className="mb-6 text-sm text-muted-foreground">برای ادامه وارد شوید.</p>
        <LoginForm />
      </div>
    </main>
  );
}
