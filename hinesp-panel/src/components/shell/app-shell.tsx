"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarOff,
  FolderKanban,
  History,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Package,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";
import type { NavGroup, NavIcon } from "./nav";

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  home: LayoutDashboard,
  projects: FolderKanban,
  tasks: ListTodo,
  attendance: CalendarClock,
  leave: CalendarOff,
  reports: BarChart3,
  products: Package,
  users: Users,
  departments: Building2,
  settings: Settings,
  audit: History,
  account: UserCircle,
};

type Props = {
  nav: NavGroup[];
  user: { fullName: string; departmentName: string };
  topbarExtra?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ nav, user, topbarExtra, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <nav className="flex h-full flex-col gap-4 p-3">
      <div className="px-2 py-1 text-lg font-bold">هاینسپ</div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {nav.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            {group.title && <div className="px-2 text-xs text-muted-foreground">{group.title}</div>}
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted",
                    active && "bg-accent font-medium text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t pt-3">
        <div className="px-2 text-sm font-medium">{user.fullName}</div>
        <div className="px-2 text-xs text-muted-foreground">{user.departmentName}</div>
        <form action={logoutAction}>
          <button className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted">
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-e bg-card lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-64 bg-card shadow-lg">
            <button className="absolute left-3 top-3 p-1" onClick={() => setOpen(false)} aria-label="بستن منو">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4">
          <button className="p-1 lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          {topbarExtra}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
