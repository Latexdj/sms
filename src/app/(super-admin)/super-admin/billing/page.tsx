"use client";

import { Banknote, CreditCard, TrendingUp, ArrowUpRight, CheckCircle2 } from "lucide-react";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const revenueData = [
  { month: "Jan", value: 3200 },
  { month: "Feb", value: 3800 },
  { month: "Mar", value: 4100 },
  { month: "Apr", value: 3900 },
  { month: "May", value: 5200 },
];

const maxRevenue = Math.max(...revenueData.map((d) => d.value));

export default function BillingPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Billing & SaaS Operations</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
          Monitor platform revenue, payment gateways, and SaaS billing operations.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Monthly Revenue", value: "GHS 45,200", change: "+12%",
            gradient: "linear-gradient(135deg, #059669, #10b981)",
            glow: "rgba(16,185,129,0.3)", icon: Banknote,
          },
          {
            label: "Annual Run Rate", value: "GHS 542k", change: "+8.2%",
            gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            glow: "rgba(124,58,237,0.3)", icon: TrendingUp,
          },
          {
            label: "Avg. Revenue / School", value: "GHS 1,840", change: "+5.1%",
            gradient: "linear-gradient(135deg, #0891b2, #06b6d4)",
            glow: "rgba(6,182,212,0.3)", icon: CreditCard,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="relative rounded-2xl p-5 overflow-hidden group" style={cardStyle}>
              <div
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: item.gradient }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: item.gradient, boxShadow: `0 0 20px ${item.glow}` }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#34d399" }}>
                    <ArrowUpRight className="h-3.5 w-3.5" /> {item.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart (simple bar) */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-6">Revenue Trend (2026)</h3>
          <div className="flex items-end gap-3 h-36">
            {revenueData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-slate-500">GHS {(d.value / 1000).toFixed(1)}k</span>
                <div className="w-full rounded-t-lg overflow-hidden" style={{ height: `${(d.value / maxRevenue) * 100}px` }}>
                  <div
                    className="w-full h-full"
                    style={{ background: "linear-gradient(180deg, #7c3aed 0%, #4f46e5 100%)", opacity: 0.85 }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-6">Payment Gateways</h3>
          <div className="space-y-4">
            {[
              { name: "Paystack", region: "Nigeria / Ghana", status: "Connected", txCount: "1,234" },
              { name: "MTN MoMo", region: "Ghana (GHS)", status: "Connected", txCount: "892" },
              { name: "Bank Transfer", region: "Manual", status: "Manual", txCount: "47" },
            ].map((gw) => (
              <div
                key={gw.name}
                className="flex items-center gap-4 rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  {gw.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{gw.name}</div>
                  <div className="text-xs text-slate-500">{gw.region}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end text-xs font-semibold" style={{ color: "#34d399" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {gw.status}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{gw.txCount} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
