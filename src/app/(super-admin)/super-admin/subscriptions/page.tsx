"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Activity, CreditCard, ShieldCheck, Zap, ArrowUpRight, ChevronRight, TrendingUp } from "lucide-react";

type SubscriptionStats = Record<string, number>;
type SubscriptionSchool = {
  id: string;
  name: string;
  subscription_plan: string | null;
  created_at: string;
};

const PLAN_CONFIG: Record<string, {
  icon: any; label: string;
  gradient: string; glow: string;
  bg: string; text: string; border: string;
  price: string;
}> = {
  FREE_TRIAL: {
    icon: Zap, label: "Free Trial",
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    glow: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)",
    price: "GHS 0/mo",
  },
  BASIC: {
    icon: Activity, label: "Basic",
    gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
    glow: "rgba(59,130,246,0.35)",
    bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.3)",
    price: "GHS 200/mo",
  },
  PREMIUM: {
    icon: ShieldCheck, label: "Premium",
    gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    glow: "rgba(139,92,246,0.35)",
    bg: "rgba(139,92,246,0.15)", text: "#a78bfa", border: "rgba(139,92,246,0.4)",
    price: "GHS 500/mo",
  },
  ENTERPRISE: {
    icon: CreditCard, label: "Enterprise",
    gradient: "linear-gradient(135deg, #047857, #10b981)",
    glow: "rgba(16,185,129,0.35)",
    bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.3)",
    price: "Custom",
  },
};

export default function SubscriptionsManagement() {
  const { data: session } = useSession();
  const [schools, setSchools] = useState<SubscriptionSchool[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/super-admin/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setSchools(data.schools);
          setStats(data.stats);
        }
      } catch { } finally { setIsLoading(false); }
    }
    if (session?.user?.role === "SUPER_ADMIN") fetchSubscriptions();
  }, [session]);

  const totalSchools = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Plans</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
          Monitor subscription tiers across {totalSchools} schools on the platform.
        </p>
      </div>

      {/* Plan stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(PLAN_CONFIG).map(([key, plan]) => {
          const Icon = plan.icon;
          const count = stats[key] ?? 0;
          const pct = totalSchools > 0 ? Math.round((count / totalSchools) * 100) : 0;
          return (
            <div
              key={key}
              className="relative rounded-2xl p-5 overflow-hidden group"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: plan.gradient }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: plan.gradient, boxShadow: `0 0 20px ${plan.glow}` }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{plan.price}</span>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 rounded-lg bg-white/10 animate-pulse mb-2" />
                ) : (
                  <div className="text-3xl font-bold text-white mb-0.5">{count}</div>
                )}
                <div className="text-xs font-medium text-slate-500 mb-3">{plan.label} Schools</div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: plan.gradient }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">{pct}% of total</span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#34d399" }}>
                    <TrendingUp className="h-3 w-3" /> Active
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-sm font-semibold text-white">All School Subscriptions</h3>
          <span className="text-xs text-slate-500">{schools.length} schools</span>
        </div>

        {/* Table header */}
        <div
          className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.5)" }}
        >
          <span>School</span>
          <span>Plan</span>
          <span>Status</span>
          <span className="text-right">Joined</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : schools.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-slate-600">No subscription data found.</p>
          </div>
        ) : (
          schools.map((school, i) => {
            const plan = PLAN_CONFIG[school.subscription_plan ?? "FREE_TRIAL"] ?? PLAN_CONFIG.FREE_TRIAL;
            const Icon = plan.icon;
            return (
              <div
                key={school.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <div className="font-medium text-sm text-white">{school.name}</div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: plan.bg, border: `1px solid ${plan.border}` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: plan.text }} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: plan.bg, color: plan.text, border: `1px solid ${plan.border}` }}
                  >
                    {plan.label}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "#34d399" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
                <span className="text-sm text-slate-500 text-right">
                  {new Date(school.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
