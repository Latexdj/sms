"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Building2, Users, GraduationCap, CreditCard,
  ShieldAlert, UserPlus, KeyRound, PauseCircle, PlayCircle,
  Trash2, Save, RefreshCw, CheckCircle2
} from "lucide-react";

type School = {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; region: string | null; subscription_plan: string | null;
  subscription_expires_at: string | null; is_active: boolean; created_at: string;
  _count: { users: number; students: number };
};
type User = { id: string; name: string; email: string; role: string; is_active: boolean };

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  FREE_TRIAL: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", label: "Free Trial" },
  BASIC:      { bg: "rgba(59,130,246,0.1)",  text: "#60a5fa",  border: "rgba(59,130,246,0.3)",  label: "Basic" },
  PREMIUM:    { bg: "rgba(139,92,246,0.15)", text: "#a78bfa",  border: "rgba(139,92,246,0.4)",  label: "Premium" },
  ENTERPRISE: { bg: "rgba(16,185,129,0.1)",  text: "#34d399",  border: "rgba(16,185,129,0.3)",  label: "Enterprise" },
};

const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inp  = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "white" };

type Tab = "overview" | "staff" | "subscription" | "danger";

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [school, setSchool] = useState<School | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staff form
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  // Password reset form
  const [pwForm, setPwForm] = useState({ userId: "", newPassword: "" });
  // Subscription form
  const [subForm, setSubForm] = useState({ plan: "BASIC", durationMonths: "6" });

  const fetchSchool = async () => {
    try {
      const [sRes, uRes] = await Promise.all([
        fetch(`/api/super-admin/schools?id=${id}`),
        fetch(`/api/super-admin/schools/${id}/admins`),
      ]);
      if (sRes.ok) {
        const data = await sRes.json();
        const found = Array.isArray(data) ? data.find((s: School) => s.id === id) : data;
        if (found) { setSchool(found); setSubForm(f => ({ ...f, plan: found.subscription_plan ?? "BASIC" })); }
      }
      if (uRes.ok) setUsers(await uRes.json());
    } catch { toast.error("Failed to load school"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchool(); }, [id]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${id}/admins`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(staffForm),
      });
      if (res.ok) { toast.success("Staff member created!"); setStaffForm({ name: "", email: "", password: "", role: "ADMIN" }); fetchSchool(); }
      else { const e = await res.json(); toast.error(e.error); }
    } catch { toast.error("Unexpected error"); } finally { setSaving(false); }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${id}/reset-password`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pwForm),
      });
      if (res.ok) { toast.success("Password reset successfully!"); setPwForm({ userId: "", newPassword: "" }); }
      else { const e = await res.json(); toast.error(e.error); }
    } catch { toast.error("Unexpected error"); } finally { setSaving(false); }
  };

  const handleActivateSub = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${id}/subscription`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: subForm.plan, durationMonths: Number(subForm.durationMonths) }),
      });
      if (res.ok) { toast.success("Subscription activated!"); fetchSchool(); }
      else { const e = await res.json(); toast.error(e.error); }
    } catch { toast.error("Unexpected error"); } finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!school) return;
    const res = await fetch(`/api/super-admin/schools/${id}/subscription`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !school.is_active }),
    });
    if (res.ok) { toast.success(school.is_active ? "School suspended" : "School reactivated"); fetchSchool(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="text-slate-400 text-sm">Loading school data...</span>
      </div>
    </div>
  );

  if (!school) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <Building2 className="h-12 w-12 text-slate-700" />
      <p className="text-slate-500">School not found.</p>
      <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const ps = PLAN_STYLES[school.subscription_plan ?? "FREE_TRIAL"] ?? PLAN_STYLES.FREE_TRIAL;
  const expiry = school.subscription_expires_at ? new Date(school.subscription_expires_at) : null;
  const expired = expiry ? expiry < new Date() : false;

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "staff", label: "Staff", icon: Users },
    { key: "subscription", label: "Subscription", icon: CreditCard },
    { key: "danger", label: "Danger Zone", icon: ShieldAlert },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/super-admin/schools")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{school.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{school.email ?? "No email"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>
              {ps.label}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={school.is_active
                ? { background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }
                : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: school.is_active ? "#10b981" : "#ef4444" }} />
              {school.is_active ? "Active" : "Suspended"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Staff Members", value: school._count.users },
          { icon: GraduationCap, label: "Students", value: school._count.students },
          { icon: CreditCard, label: "Subscription Expires", value: expiry ? (expired ? "Expired" : expiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })) : "No expiry" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl p-4" style={card}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
              style={active
                ? { background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))", color: "white", border: "1px solid rgba(139,92,246,0.3)" }
                : { color: "#64748b", border: "1px solid transparent" }}
            >
              <Icon className="h-4 w-4 shrink-0" /> <span className="hidden sm:block">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="rounded-2xl p-6 space-y-5" style={card}>
          <h2 className="text-sm font-semibold text-white mb-4">School Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["School Name", school.name],
              ["Email", school.email ?? "—"],
              ["Phone", school.phone ?? "—"],
              ["Address", school.address ?? "—"],
              ["Region", school.region ?? "—"],
              ["Registered On", new Date(school.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">{label}</p>
                <p className="text-sm text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="space-y-6">
          {/* Create Staff */}
          <div className="rounded-2xl p-6" style={card}>
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Add Staff Member</h2>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Full Name</Label>
                  <Input required value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} style={inp} className="border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Email Address</Label>
                  <Input type="email" required value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} style={inp} className="border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Password</Label>
                  <Input type="password" required value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} style={inp} className="border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Role</Label>
                  <Select value={staffForm.role ?? "ADMIN"} onValueChange={v => setStaffForm({ ...staffForm, role: v ?? "ADMIN" })}>
                    <SelectTrigger style={inp} className="border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1535] border-slate-700">
                      {(["ADMIN", "HEADTEACHER", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] as string[]).map(r => (
                        <SelectItem key={r} value={r} className="text-white focus:bg-white/10">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="text-white" style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
                  <UserPlus className="mr-2 h-4 w-4" /> {saving ? "Creating..." : "Create Staff Member"}
                </Button>
              </div>
            </form>
          </div>

          {/* Reset Password */}
          <div className="rounded-2xl p-6" style={card}>
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Reset Staff Password</h2>
            </div>
            <form onSubmit={handleResetPw} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Select User</Label>
                  <Select value={pwForm.userId ?? ""} onValueChange={v => setPwForm({ ...pwForm, userId: v ?? "" })}>
                    <SelectTrigger style={inp} className="border"><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                    <SelectContent className="bg-[#1a1535] border-slate-700">
                      {users.map(u => (
                        <SelectItem key={u.id} value={String(u.id)} className="text-white focus:bg-white/10">
                          {u.name} — {u.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">New Password (min. 6 chars)</Label>
                  <Input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} style={inp} className="border" placeholder="New password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving || !pwForm.userId} className="text-white" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                  <KeyRound className="mr-2 h-4 w-4" /> {saving ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </div>

          {/* Staff List */}
          <div className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-semibold text-white">Current Staff ({users.length})</h2>
            </div>
            {users.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-slate-600 text-sm">No staff members yet.</div>
            ) : users.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02]"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div>
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "subscription" && (
        <div className="rounded-2xl p-6 space-y-6" style={card}>
          {/* Current status */}
          <div className="rounded-xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p className="text-xs text-slate-500 mb-2">Current Subscription</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">{ps.label}</span>
              {expiry ? (
                <span className="text-sm font-medium" style={{ color: expired ? "#f87171" : "#34d399" }}>
                  {expired ? "⚠ Expired " : "✓ Active until "}{expiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              ) : <span className="text-sm text-slate-500">No expiry date</span>}
            </div>
          </div>

          <form onSubmit={handleActivateSub} className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Activate / Change Plan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Plan</Label>
                <Select value={subForm.plan ?? "BASIC"} onValueChange={v => setSubForm({ ...subForm, plan: v ?? "BASIC" })}>
                  <SelectTrigger style={inp} className="border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1535] border-slate-700">
                    {([["FREE_TRIAL", "Free Trial"], ["BASIC", "Basic"], ["PREMIUM", "Premium"], ["ENTERPRISE", "Enterprise"]] as [string, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-white focus:bg-white/10">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subForm.plan !== "FREE_TRIAL" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Duration</Label>
                  <Select value={subForm.durationMonths ?? "6"} onValueChange={v => setSubForm({ ...subForm, durationMonths: v ?? "6" })}>
                    <SelectTrigger style={inp} className="border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1535] border-slate-700">
                      {([["1", "1 Month"], ["3", "3 Months"], ["6", "6 Months"], ["12", "1 Year"], ["24", "2 Years"]] as [string, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-white focus:bg-white/10">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {subForm.plan !== "FREE_TRIAL" ? "If an active subscription exists, the new duration will be added on top." : "Free Trial has no expiry date."}
            </p>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> {saving ? "Activating..." : "Activate Plan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {tab === "danger" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-2">
              {school.is_active ? <PauseCircle className="h-5 w-5 text-amber-400" /> : <PlayCircle className="h-5 w-5 text-emerald-400" />}
              <h2 className="text-sm font-semibold text-white">{school.is_active ? "Suspend School" : "Reactivate School"}</h2>
            </div>
            <p className="text-sm text-slate-400">
              {school.is_active
                ? "Suspending the school will prevent all its users from logging in. Data is preserved."
                : "Reactivating the school will restore access for all its users."}
            </p>
            <Button
              onClick={handleToggle}
              className="font-semibold text-white"
              style={school.is_active
                ? { background: "linear-gradient(135deg, #d97706, #f59e0b)" }
                : { background: "linear-gradient(135deg, #047857, #10b981)" }}
            >
              {school.is_active ? <><PauseCircle className="mr-2 h-4 w-4" /> Suspend School</> : <><PlayCircle className="mr-2 h-4 w-4" /> Reactivate School</>}
            </Button>
          </div>

          <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Delete School</h2>
            </div>
            <p className="text-sm text-slate-400">Permanently deletes the school and ALL its data. This action cannot be undone.</p>
            <Button className="font-semibold text-white" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
              <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete School
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
