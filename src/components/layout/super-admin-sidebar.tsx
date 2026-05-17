"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  Shield,
  Globe,
  Banknote,
  ShieldAlert,
  ChevronRight,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const superAdminNavigationLinks = [
  {
    section: "Overview",
    links: [
      { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    ],
  },
  {
    section: "Management",
    links: [
      { name: "Schools", href: "/super-admin/schools", icon: Building2 },
      { name: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard },
    ],
  },
  {
    section: "Platform",
    links: [
      { name: "Global Config", href: "/super-admin/global-config", icon: Globe },
      { name: "Billing & SaaS", href: "/super-admin/billing", icon: Banknote },
      { name: "Security", href: "/super-admin/security", icon: ShieldAlert },
    ],
  },
  {
    section: "System",
    links: [
      { name: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

export const allSuperAdminLinks = superAdminNavigationLinks.flatMap((s) => s.links);

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[240px] shrink-0 min-h-screen border-r"
      style={{
        background: "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        borderColor: "rgba(139, 92, 246, 0.15)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[64px] items-center gap-3 px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.15)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)",
          }}
        >
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-white tracking-tight">SchoolMS</div>
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "rgba(167, 139, 250, 0.8)" }}
          >
            Super Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {superAdminNavigationLinks.map((group) => (
            <div key={group.section}>
              <p
                className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(139, 92, 246, 0.6)" }}
              >
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/super-admin" && pathname.startsWith(`${link.href}/`));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))",
                              border: "1px solid rgba(139, 92, 246, 0.3)",
                              boxShadow: "0 0 12px rgba(124, 58, 237, 0.2)",
                            }
                          : {
                              border: "1px solid transparent",
                            }
                      }
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-violet-400" : "text-slate-500 group-hover:text-violet-400"
                        )}
                      />
                      <span className="flex-1">{link.name}</span>
                      {isActive && (
                        <ChevronRight className="h-3 w-3 text-violet-400 opacity-70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderTop: "1px solid rgba(139, 92, 246, 0.15)" }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)" }}
        >
          <Shield className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] text-slate-400">Platform v2.0 · Multi-Tenant</span>
        </div>
      </div>
    </aside>
  );
}
