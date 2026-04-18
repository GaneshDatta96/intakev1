
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, Users, LayoutDashboard } from "lucide-react";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "New Intake", href: "/intake", icon: Stethoscope },
];

export function GlobalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-white/70 backdrop-blur-xl">
      <div className="flex min-h-[4.5rem] w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-white/80 shadow-sm">
            <Stethoscope className="h-5 w-5 text-[color:var(--accent)]" />
          </span>
          <span className="flex flex-col">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Intake Workspace
            </span>
            <span className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
              Modern Health
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                pathname === item.href
                  ? "bg-[color:var(--foreground)] text-white shadow-[0_10px_30px_rgba(20,33,37,0.16)]"
                  : "text-[color:var(--muted-strong)] hover:bg-white/80 hover:text-[color:var(--foreground)]"
              )}
            >
              <item.icon className="mr-2 inline h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
