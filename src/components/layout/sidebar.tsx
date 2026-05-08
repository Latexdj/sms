"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  CalendarCheck,
  FileText,
  BookOpen,
  CalendarDays,
  Bus,
  Utensils,
  Wallet,
  MessageSquare,
  Library,
  Package,
  Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Role = "SUPER_ADMIN" | "ADMIN" | "HEADTEACHER" | "TEACHER" | "ACCOUNTANT" | "PARENT" | "LIBRARIAN";

interface SidebarProps {
  role: Role;
}

export const navigationLinks = [
  { name: "Dashboard",      href: "/dashboard",             icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "ACCOUNTANT", "PARENT"] },
  { name: "Students",       href: "/dashboard/students",    icon: Users,           roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER"] },
  { name: "Teachers",       href: "/dashboard/teachers",    icon: GraduationCap,   roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER"] },
  { name: "Fees & Billing", href: "/dashboard/fees",        icon: CreditCard,      roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "PARENT"] },
  { name: "Attendance",     href: "/dashboard/attendance",  icon: CalendarCheck,   roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "PARENT"] },
  { name: "Exams & Reports",href: "/dashboard/exams",       icon: FileText,        roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "PARENT"] },
  { name: "Assignments",    href: "/dashboard/assignments", icon: BookOpen,        roles: ["TEACHER", "PARENT", "ADMIN", "HEADTEACHER"] },
  { name: "Timetable",      href: "/dashboard/timetable",   icon: CalendarDays,    roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "PARENT"] },
  { name: "Transport",      href: "/dashboard/transport",   icon: Bus,             roles: ["SUPER_ADMIN", "ADMIN", "PARENT"] },
  { name: "Cafeteria",      href: "/dashboard/cafeteria",   icon: Utensils,        roles: ["SUPER_ADMIN", "ADMIN"] },
  { name: "Accounting",     href: "/dashboard/accounting",  icon: Wallet,          roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { name: "Communication",  href: "/dashboard/communication",icon: MessageSquare,  roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER"] },
  { name: "Library",        href: "/dashboard/library",     icon: Library,         roles: ["SUPER_ADMIN", "ADMIN", "LIBRARIAN"] },
  { name: "Inventory",      href: "/dashboard/inventory",   icon: Package,         roles: ["SUPER_ADMIN", "ADMIN"] },
  { name: "Settings",       href: "/dashboard/settings",    icon: Settings,        roles: ["SUPER_ADMIN", "ADMIN", "HEADTEACHER"] },
];

const NAV_GROUPS = [
  {
    label: "Overview",
    links: ["Dashboard"],
  },
  {
    label: "Academic",
    links: ["Students", "Teachers", "Attendance", "Exams & Reports", "Assignments", "Timetable"],
  },
  {
    label: "Operations",
    links: ["Fees & Billing", "Accounting", "Transport", "Cafeteria", "Library", "Inventory"],
  },
  {
    label: "Administration",
    links: ["Communication", "Settings"],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const filteredLinks = navigationLinks.filter((link) => link.roles.includes(role));
  const filteredNames = new Set(filteredLinks.map((l) => l.name));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 min-h-screen bg-[oklch(0.145_0.03_264.5)] border-r border-[oklch(0.25_0.04_264.5)]">
      {/* Logo */}
      <div className="flex h-[60px] items-center gap-3 px-5 border-b border-[oklch(0.25_0.04_264.5)] shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
          <GraduationCap className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-white tracking-tight">SchoolMS</span>
          <p className="text-[10px] text-[oklch(0.55_0.04_264.5)] leading-none mt-0.5 uppercase tracking-widest">Management</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-5">
          {NAV_GROUPS.map((group) => {
            const groupLinks = filteredLinks.filter((l) => group.links.includes(l.name));
            if (groupLinks.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[oklch(0.45_0.04_264.5)]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {groupLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary text-white shadow-sm shadow-primary/30"
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
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[oklch(0.25_0.04_264.5)] shrink-0">
        <p className="text-[10px] text-[oklch(0.38_0.03_264.5)] text-center">
          SchoolMS v2.0 · GES Compliant
        </p>
      </div>
    </aside>
  );
}
