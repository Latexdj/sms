"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Users,
  TrendingUp,
  ArrowUpRight,
  Globe,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

interface SuperAdminStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalUsers: number;
}

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: "#f59e0b",
  BASIC: "#3b82f6",
  PREMIUM: "#8b5cf6",
  ENTERPRISE: "#10b981",
};

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/super-admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch super admin stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (session?.user?.role === "SUPER_ADMIN") fetchStats();
  }, [session]);

  const statCards = [
    {
      title: "Total Schools",
      value: stats.totalSchools,
      icon: Building2,
      change: "+3 this month",
      up: true,
      gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      glow: "rgba(124, 58, 237, 0.3)",
      link: "/super-admin/schools",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: Activity,
      change: "+12% vs last month",
      up: true,
      gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
      glow: "rgba(6, 182, 212, 0.3)",
      link: "/super-admin/subscriptions",
    },
    {
      title: "Platform Revenue",
      value: `GHS ${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      change: "+8.2% this quarter",
      up: true,
      gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      glow: "rgba(16, 185, 129, 0.3)",
      link: "/super-admin/billing",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      change: "Across all tenants",
      up: true,
      gradient: "linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)",
      glow: "rgba(244, 63, 94, 0.3)",
      link: "/super-admin/schools",
    },
  ];

  const quickActions = [
    { label: "Register New School", href: "/super-admin/schools", icon: Building2, color: "#7c3aed" },
    { label: "View Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard, color: "#0891b2" },
    { label: "Platform Security", href: "/super-admin/security", icon: ShieldCheck, color: "#059669" },
    { label: "Global Config", href: "/super-admin/global-config", icon: Globe, color: "#f59e0b" },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(148, 163, 184, 0.8)" }}>
            Welcome back,{" "}
            <span className="text-violet-400 font-medium">{session?.user?.name}</span>.
            Here's what's happening across your SaaS platform.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
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
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link href={card.link} key={i}>
              <div
                className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Gradient glow orb */}
                <div
                  className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-2xl"
                  style={{ background: card.gradient }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: card.gradient, boxShadow: `0 0 20px ${card.glow}` }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                  )}
                  <div className="text-xs font-medium text-slate-500">{card.title}</div>
                  <div
                    className="mt-3 flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: "#34d399" }}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {card.change}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Content Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer group hover:bg-white/5"
                    style={{ border: "1px solid transparent" }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${action.color}20`, border: `1px solid ${action.color}30` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">
                      {action.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {[
              { label: "Free Trial", value: "—", color: PLAN_COLORS.FREE_TRIAL },
              { label: "Basic", value: "—", color: PLAN_COLORS.BASIC },
              { label: "Premium", value: "—", color: PLAN_COLORS.PREMIUM },
              { label: "Enterprise", value: "—", color: PLAN_COLORS.ENTERPRISE },
            ].map((plan) => (
              <div key={plan.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: plan.color }} />
                  <span className="text-sm text-slate-400">{plan.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{plan.value}</span>
              </div>
            ))}
          </div>
          <Link href="/super-admin/subscriptions">
            <div
              className="mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                color: "#a78bfa",
              }}
            >
              View Full Report <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

        {/* Platform Health */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Platform Health</h3>
          <div className="space-y-4">
            {[
              { label: "Multi-Tenant Isolation", status: "Enforced", ok: true },
              { label: "Database Connectivity", status: "Connected", ok: true },
              { label: "Payment Gateways", status: "Active", ok: true },
              { label: "Security Alerts", status: "1 Warning", ok: false },
              { label: "API Uptime", status: "99.98%", ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.ok ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="text-sm text-slate-400">{item.label}</span>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: item.ok ? "#34d399" : "#fbbf24" }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
