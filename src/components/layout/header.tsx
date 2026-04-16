
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
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Modern Health
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
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
