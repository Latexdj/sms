"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { allSuperAdminLinks } from "./super-admin-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Menu,
  Bell,
  LogOut,
  ChevronRight,
  Zap,
  Settings,
  ExternalLink,
} from "lucide-react";
import { superAdminNavigationLinks } from "./super-admin-sidebar";

interface SuperAdminHeaderProps {
  name: string;
  email: string;
}

export function SuperAdminHeader({ name, email }: SuperAdminHeaderProps) {
  const pathname = usePathname();

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const currentPage = allSuperAdminLinks.find(
    (l) =>
      pathname === l.href ||
      (l.href !== "/super-admin" && pathname.startsWith(`${l.href}/`))
  );

  return (
    <header
      className="sticky top-0 z-30 flex h-[64px] items-center gap-4 px-4 lg:px-6"
      style={{
        background: "rgba(15, 12, 41, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(139, 92, 246, 0.15)",
      }}
    >
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger render={
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden text-slate-400 hover:text-white hover:bg-white/10" />
        }>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex flex-col w-[260px] p-0 border-r-0"
          style={{
            background: "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            borderColor: "rgba(139, 92, 246, 0.15)",
          }}
        >
          <div
            className="flex h-[64px] items-center gap-3 px-5"
            style={{ borderBottom: "1px solid rgba(139, 92, 246, 0.15)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">SchoolMS</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-400">Super Admin</div>
            </div>
          </div>
          <nav className="flex-1 overflow-auto p-3 space-y-6 py-4">
            {superAdminNavigationLinks.map((group) => (
              <div key={group.section}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600/60">
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
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                          isActive ? "text-white" : "text-slate-400 hover:text-white"
                        )}
                        style={isActive ? {
                          background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                        } : { border: "1px solid transparent" }}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-violet-400" : "text-slate-500")} />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-500 hidden sm:block">Super Admin</span>
        {currentPage && currentPage.href !== "/super-admin" && (
          <>
            <ChevronRight className="h-3 w-3 text-slate-600 hidden sm:block shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate hidden sm:block">
              {currentPage.name}
            </span>
          </>
        )}
        {currentPage?.href === "/super-admin" && (
          <span className="text-xs font-semibold text-slate-200 hidden sm:block">Overview</span>
        )}
        <span className="text-sm font-semibold text-white sm:hidden truncate">
          {currentPage?.name ?? "Super Admin"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Live status indicator */}
        <div
          className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            color: "#34d399",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          All Systems Operational
        </div>

        {/* Visit site */}
        <Link href="/dashboard" target="_blank">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visit App
          </Button>
        </Link>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10 h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500"
            style={{ boxShadow: "0 0 6px rgba(124, 58, 237, 0.8)" }}
          />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50" />
          }>
            <Avatar className="h-8 w-8" style={{ border: "2px solid rgba(139, 92, 246, 0.4)" }}>
              <AvatarFallback
                className="text-[12px] font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
              >
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-[13px] font-semibold text-white">{name}</span>
              <span className="text-[11px] text-slate-500 truncate max-w-[130px]">{email}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-slate-800"
            style={{ background: "#1a1535", color: "white" }}
          >
            <DropdownMenuLabel className="pb-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-white leading-none">{name}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="gap-2 text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer">
              <Settings className="h-3.5 w-3.5" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
