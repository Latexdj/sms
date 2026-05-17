"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, CreditCard, Settings, Shield, Globe, Banknote, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const superAdminNavigationLinks = [
  { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { name: "Schools", href: "/super-admin/schools", icon: Building2 },
  { name: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard },
  { name: "Global Config", href: "/super-admin/global-config", icon: Globe },
  { name: "Billing & SaaS", href: "/super-admin/billing", icon: Banknote },
  { name: "Security", href: "/super-admin/security", icon: ShieldAlert },
  { name: "Settings", href: "/super-admin/settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 min-h-screen bg-[oklch(0.145_0.03_264.5)] border-r border-[oklch(0.25_0.04_264.5)]">
      {/* Logo */}
      <div className="flex h-[60px] items-center gap-3 px-5 border-b border-[oklch(0.25_0.04_264.5)] shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
          <Shield className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-white tracking-tight">SchoolMS</span>
          <p className="text-[10px] text-[oklch(0.55_0.04_264.5)] leading-none mt-0.5 uppercase tracking-widest">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-5">
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[oklch(0.45_0.04_264.5)]">
              Overview
            </p>
            <div className="space-y-0.5">
              {superAdminNavigationLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/super-admin" && pathname.startsWith(`${link.href}/`));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "text-[oklch(0.65_0.03_264.5)] hover:bg-[oklch(0.22_0.04_264.5)] hover:text-[oklch(0.88_0.02_264.5)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-[oklch(0.50_0.05_264.5)] group-hover:text-[oklch(0.75_0.05_264.5)]"
                      )}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[oklch(0.25_0.04_264.5)] shrink-0">
        <p className="text-[10px] text-[oklch(0.38_0.03_264.5)] text-center">
          SchoolMS Super Admin
        </p>
      </div>
    </aside>
  );
}
