"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role, navigationLinks } from "./sidebar";
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
import { Menu, GraduationCap, LogOut, User, Settings, ChevronRight } from "lucide-react";

interface HeaderProps {
  role: Role;
  name: string;
  email: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  HEADTEACHER: "Head Teacher",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  PARENT: "Parent",
  LIBRARIAN: "Librarian",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  HEADTEACHER: "bg-emerald-100 text-emerald-700",
  TEACHER: "bg-amber-100 text-amber-700",
  ACCOUNTANT: "bg-orange-100 text-orange-700",
  PARENT: "bg-sky-100 text-sky-700",
  LIBRARIAN: "bg-teal-100 text-teal-700",
};

export function Header({ role, name, email }: HeaderProps) {
  const pathname = usePathname();
  const filteredLinks = navigationLinks.filter((link) => link.roles.includes(role));

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const currentPage = navigationLinks.find(
    (l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`))
  );

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-border/60 bg-white/80 backdrop-blur-md px-4 lg:px-6 shadow-sm">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[280px] p-0 bg-[oklch(0.145_0.03_264.5)] border-r-0">
          {/* Mobile logo */}
          <div className="flex h-[60px] items-center gap-3 px-5 border-b border-[oklch(0.25_0.04_264.5)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-[15px] font-bold text-white">SchoolMS</span>
          </div>
          <nav className="flex-1 overflow-auto p-3 space-y-0.5">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white"
                      : "text-[oklch(0.65_0.03_264.5)] hover:bg-[oklch(0.22_0.04_264.5)] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground hidden sm:block">Dashboard</span>
        {currentPage && currentPage.href !== "/dashboard" && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 hidden sm:block shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate hidden sm:block">
              {currentPage.name}
            </span>
          </>
        )}
        {/* Mobile title */}
        <span className="text-sm font-semibold text-foreground sm:hidden truncate">
          {currentPage?.name ?? "Dashboard"}
        </span>
      </div>

      {/* Role badge */}
      <span className={cn(
        "hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide shrink-0",
        ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"
      )}>
        {ROLE_LABELS[role] ?? role}
      </span>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
          }
        >
          <Avatar className="h-7 w-7 ring-2 ring-primary/20">
            <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-[13px] font-semibold text-foreground">{name}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">{email}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="pb-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold leading-none">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <User className="h-3.5 w-3.5" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={() => {}}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
