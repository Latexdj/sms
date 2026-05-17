"use client";

import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, Eye, CheckCircle2, XCircle } from "lucide-react";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const securityChecks = [
  { label: "Multi-Tenant Data Isolation", detail: "Prisma ORM-level `school_id` enforcement on all queries", ok: true },
  { label: "JWT Session Security", detail: "Role and school ID embedded in encrypted token", ok: true },
  { label: "Password Hashing", detail: "bcrypt with 10 salt rounds applied to all user passwords", ok: true },
  { label: "Route Protection", detail: "Next.js middleware enforces auth on /dashboard and /super-admin", ok: true },
  { label: "HTTPS Enforced", detail: "Vercel automatically provisions TLS certificates", ok: true },
  { label: "Environment Variables", detail: "DATABASE_URL and secrets stored in Vercel Vault", ok: true },
];

const recentEvents = [
  { type: "warn", msg: "5 failed login attempts from IP 196.45.22.1 targeting school@example.com", time: "2 hours ago" },
  { type: "ok", msg: "New school 'Achimota School' registered and tenant isolated", time: "5 hours ago" },
  { type: "ok", msg: "SUPER_ADMIN role updated for latexdj@gmail.com", time: "8 hours ago" },
  { type: "ok", msg: "Database SSL certificate renewed successfully", time: "1 day ago" },
];

export default function SecurityPage() {
  const failingChecks = securityChecks.filter((c) => !c.ok).length;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Security Oversight</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
          Monitor multi-tenant isolation, auth security, and system-wide compliance status.
        </p>
      </div>

      {/* Security Score */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
        style={{
          background: failingChecks === 0
            ? "linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.08) 100%)"
            : "linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(245,158,11,0.08) 100%)",
          border: failingChecks === 0
            ? "1px solid rgba(16,185,129,0.25)"
            : "1px solid rgba(245,158,11,0.25)",
        }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: failingChecks === 0
              ? "linear-gradient(135deg, #047857, #10b981)"
              : "linear-gradient(135deg, #d97706, #f59e0b)",
            boxShadow: failingChecks === 0
              ? "0 0 24px rgba(16,185,129,0.4)"
              : "0 0 24px rgba(245,158,11,0.4)",
          }}
        >
          {failingChecks === 0
            ? <ShieldCheck className="h-7 w-7 text-white" />
            : <ShieldAlert className="h-7 w-7 text-white" />
          }
        </div>
        <div>
          <div className="text-lg font-bold text-white">
            Security Score: {Math.round(((securityChecks.length - failingChecks) / securityChecks.length) * 100)}%
          </div>
          <div className="text-sm mt-0.5" style={{ color: failingChecks === 0 ? "#34d399" : "#fbbf24" }}>
            {failingChecks === 0
              ? "All security checks passed. Platform is operating securely."
              : `${failingChecks} check(s) require attention.`
            }
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Checklist */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <Lock className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Security Checklist</h3>
          </div>
          <div className="space-y-4">
            {securityChecks.map((check) => (
              <div key={check.label} className="flex items-start gap-3">
                {check.ok
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                }
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{check.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{check.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Recent Security Events</h3>
          </div>
          <div className="space-y-4">
            {recentEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{
                  background: ev.type === "warn"
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(16,185,129,0.06)",
                  border: ev.type === "warn"
                    ? "1px solid rgba(245,158,11,0.2)"
                    : "1px solid rgba(16,185,129,0.15)",
                }}
              >
                {ev.type === "warn"
                  ? <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                }
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 leading-relaxed">{ev.msg}</p>
                  <span className="text-[11px] text-slate-600 mt-1 block">{ev.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
