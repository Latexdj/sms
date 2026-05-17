"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Search, MoreVertical, Trash, PauseCircle, PlayCircle,
  Eye, Building2, Users, GraduationCap, UserPlus, KeyRound, CreditCard, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type School = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  _count: { users: number; students: number };
};

type SchoolUser = { id: string; name: string; email: string; role: string; is_active: boolean };

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  FREE_TRIAL: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", label: "Free Trial" },
  BASIC:      { bg: "rgba(59,130,246,0.1)",  text: "#60a5fa",  border: "rgba(59,130,246,0.3)",  label: "Basic" },
  PREMIUM:    { bg: "rgba(139,92,246,0.15)", text: "#a78bfa",  border: "rgba(139,92,246,0.4)",  label: "Premium" },
  ENTERPRISE: { bg: "rgba(16,185,129,0.1)",  text: "#34d399",  border: "rgba(16,185,129,0.3)",  label: "Enterprise" },
};

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "white" };
const dialogStyle = { background: "#1a1535", color: "white" };

export default function SchoolsManagement() {
  const { data: session } = useSession();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [dialog, setDialog] = useState<"register" | "admin" | "password" | "subscription" | "detail" | null>(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", address: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [passwordForm, setPasswordForm] = useState({ userId: "", newPassword: "" });
  const [subForm, setSubForm] = useState({ plan: "BASIC", durationMonths: "6" });
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchools = async (search = "") => {
    setIsLoading(true);
    try {
      const url = new URL("/api/super-admin/schools", window.location.origin);
      if (search) url.searchParams.append("search", search);
      const res = await fetch(url.toString());
      if (res.ok) setSchools(await res.json());
    } catch { } finally { setIsLoading(false); }
  };

  const fetchSchoolUsers = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}/admins`);
      if (res.ok) setSchoolUsers(await res.json());
    } catch { }
  };

  useEffect(() => { if (session?.user?.role === "SUPER_ADMIN") fetchSchools(); }, [session]);

  const openDialog = (type: typeof dialog, school?: School) => {
    setActiveSchool(school ?? null);
    setDialog(type);
    if (school && (type === "password" || type === "detail")) fetchSchoolUsers(school.id);
  };

  const closeDialog = () => { setDialog(null); setActiveSchool(null); };

  // --- Handlers ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch("/api/super-admin/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(registerForm) });
      if (res.ok) { closeDialog(); fetchSchools(); toast.success("School registered successfully!"); setRegisterForm({ name: "", email: "", phone: "", address: "", adminName: "", adminEmail: "", adminPassword: "" }); }
      else { const err = await res.json(); toast.error(err.error || "Failed to create school"); }
    } catch { toast.error("Unexpected error"); } finally { setIsSubmitting(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${activeSchool!.id}/admins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminForm) });
      if (res.ok) { closeDialog(); toast.success("Admin created successfully!"); setAdminForm({ name: "", email: "", password: "", role: "ADMIN" }); }
      else { const err = await res.json(); toast.error(err.error || "Failed to create admin"); }
    } catch { toast.error("Unexpected error"); } finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${activeSchool!.id}/reset-password`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(passwordForm) });
      if (res.ok) { closeDialog(); toast.success("Password reset successfully!"); }
      else { const err = await res.json(); toast.error(err.error || "Failed to reset password"); }
    } catch { toast.error("Unexpected error"); } finally { setIsSubmitting(false); }
  };

  const handleSubscription = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${activeSchool!.id}/subscription`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: subForm.plan, durationMonths: Number(subForm.durationMonths) }) });
      if (res.ok) { closeDialog(); fetchSchools(); toast.success(`Subscription activated: ${subForm.plan} for ${subForm.durationMonths} months`); }
      else { const err = await res.json(); toast.error(err.error || "Failed to update subscription"); }
    } catch { toast.error("Unexpected error"); } finally { setIsSubmitting(false); }
  };

  const handleToggleActive = async (school: School) => {
    try {
      const res = await fetch(`/api/super-admin/schools/${school.id}/subscription`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !school.is_active }) });
      if (res.ok) { fetchSchools(); toast.success(school.is_active ? "School suspended" : "School reactivated"); }
    } catch { toast.error("Failed to update school status"); }
  };

  const planStyle = (plan: string | null) => PLAN_STYLES[plan ?? "FREE_TRIAL"] ?? PLAN_STYLES.FREE_TRIAL;

  const formatExpiry = (date: string | null) => {
    if (!date) return "No expiry";
    const d = new Date(date);
    const isExpired = d < new Date();
    return (
      <span style={{ color: isExpired ? "#f87171" : "#34d399" }}>
        {isExpired ? "Expired " : "Until "}{d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    );
  };

  // Shared dialog wrapper style
  const DlgContent = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <DialogContent className="max-w-lg border-slate-800 max-h-[90vh] overflow-y-auto" style={dialogStyle}>
      <DialogHeader><DialogTitle className="text-white">{title}</DialogTitle></DialogHeader>
      {children}
    </DialogContent>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-400">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Schools Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>Register, manage, and configure schools on the platform.</p>
        </div>
        <Button className="font-semibold text-white shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none" }} onClick={() => openDialog("register")}>
          <Plus className="mr-2 h-4 w-4" /> Register School
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={cardStyle}>
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <Input placeholder="Search schools..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) fetchSchools(); }} onKeyDown={(e) => e.key === "Enter" && fetchSchools(searchQuery)} className="border-0 bg-transparent text-white placeholder:text-slate-600 focus-visible:ring-0 p-0 h-auto text-sm" />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1fr_auto] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.5)" }}>
          <span>School</span><span>Plan</span><span>Expires</span><span><Users className="h-3 w-3 inline mr-1"/>Staff</span><span><GraduationCap className="h-3 w-3 inline mr-1"/>Students</span><span>Status</span><span></span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>
        ) : schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3"><Building2 className="h-8 w-8 text-slate-700" /><p className="text-sm text-slate-600">No schools found.</p></div>
        ) : schools.map((school, i) => {
          const ps = planStyle(school.subscription_plan);
          return (
            <div key={school.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1fr_auto] gap-3 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div>
                <div className="text-sm font-semibold text-white">{school.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{school.email ?? "No email"}</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>{ps.label}</span>
              <span className="text-xs">{formatExpiry(school.subscription_expires_at)}</span>
              <span className="text-sm text-slate-300">{school._count.users}</span>
              <span className="text-sm text-slate-300">{school._count.students}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: school.is_active ? "#34d399" : "#f87171" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: school.is_active ? "#10b981" : "#ef4444" }} />
                {school.is_active ? "Active" : "Suspended"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10" />}>
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-slate-800 bg-[#1a1535] w-52">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2" onClick={() => openDialog("detail", school)}><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2" onClick={() => openDialog("admin", school)}><UserPlus className="h-4 w-4 text-blue-400" /> Create Admin</DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2" onClick={() => openDialog("password", school)}><KeyRound className="h-4 w-4 text-amber-400" /> Reset Password</DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2" onClick={() => openDialog("subscription", school)}><CreditCard className="h-4 w-4 text-violet-400" /> Manage Subscription</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2" style={{ color: school.is_active ? "#fbbf24" : "#34d399" }} onClick={() => handleToggleActive(school)}>
                    {school.is_active ? <><PauseCircle className="h-4 w-4" /> Suspend School</> : <><PlayCircle className="h-4 w-4" /> Reactivate School</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer gap-2"><Trash className="h-4 w-4" /> Delete School</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* ── DIALOGS ─────────────────────────────────── */}

      {/* Register School */}
      <Dialog open={dialog === "register"} onOpenChange={(o) => !o && closeDialog()}>
        <DlgContent title="Register New School">
          <form onSubmit={handleRegister} className="space-y-5 mt-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 border-b border-violet-900 pb-1.5">School Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[["School Name","name",true],["Email","email",false,"email"],["Phone","phone"],["Address","address"]].map(([l,k,req,t]:any) => (
                  <Field key={k} label={l}><Input type={t??'text'} required={!!req} value={(registerForm as any)[k]} onChange={e=>setRegisterForm({...registerForm,[k]:e.target.value})} style={inputStyle} className="border" /></Field>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 border-b border-violet-900 pb-1.5">First Admin Account</p>
              <div className="grid grid-cols-2 gap-3">
                {[["Admin Name","adminName",true],["Admin Email","adminEmail",true,"email"],["Password","adminPassword",true,"password"]].map(([l,k,req,t]:any) => (
                  <Field key={k} label={l}><Input type={t??'text'} required={!!req} value={(registerForm as any)[k]} onChange={e=>setRegisterForm({...registerForm,[k]:e.target.value})} style={inputStyle} className="border" /></Field>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>{isSubmitting ? "Creating..." : "Create School"}</Button>
            </div>
          </form>
        </DlgContent>
      </Dialog>

      {/* Create Admin */}
      <Dialog open={dialog === "admin"} onOpenChange={(o) => !o && closeDialog()}>
        <DlgContent title={`Add Admin — ${activeSchool?.name}`}>
          <form onSubmit={handleCreateAdmin} className="space-y-4 mt-2">
            <Field label="Full Name"><Input required value={adminForm.name} onChange={e=>setAdminForm({...adminForm,name:e.target.value})} style={inputStyle} className="border" /></Field>
            <Field label="Email Address"><Input type="email" required value={adminForm.email} onChange={e=>setAdminForm({...adminForm,email:e.target.value})} style={inputStyle} className="border" /></Field>
            <Field label="Password"><Input type="password" required value={adminForm.password} onChange={e=>setAdminForm({...adminForm,password:e.target.value})} style={inputStyle} className="border" /></Field>
            <Field label="Role">
              <Select value={adminForm.role ?? "ADMIN"} onValueChange={v=>setAdminForm({...adminForm,role:v ?? "ADMIN"})}>
                <SelectTrigger style={inputStyle} className="border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1535] border-slate-700">
                  {(["ADMIN","HEADTEACHER","TEACHER","ACCOUNTANT","LIBRARIAN"] as string[]).map(r=><SelectItem key={r} value={r} className="text-white focus:bg-white/10">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="text-white" style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>{isSubmitting ? "Creating..." : "Create Admin"}</Button>
            </div>
          </form>
        </DlgContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={dialog === "password"} onOpenChange={(o) => !o && closeDialog()}>
        <DlgContent title={`Reset Password — ${activeSchool?.name}`}>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <Field label="Select User">
              <Select value={passwordForm.userId ?? ""} onValueChange={v=>setPasswordForm({...passwordForm,userId:v ?? ""})}>
                <SelectTrigger style={inputStyle} className="border"><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                <SelectContent className="bg-[#1a1535] border-slate-700">
                  {schoolUsers.map(u=><SelectItem key={u.id} value={String(u.id)} className="text-white focus:bg-white/10">{u.name} — {u.role}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="New Password"><Input type="password" required minLength={6} value={passwordForm.newPassword} onChange={e=>setPasswordForm({...passwordForm,newPassword:e.target.value})} placeholder="Minimum 6 characters" style={inputStyle} className="border" /></Field>
            <p className="text-xs text-slate-500">The user must be notified of their new password separately. This action is irreversible.</p>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !passwordForm.userId} className="text-white" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>{isSubmitting ? "Resetting..." : "Reset Password"}</Button>
            </div>
          </form>
        </DlgContent>
      </Dialog>

      {/* Subscription Management */}
      <Dialog open={dialog === "subscription"} onOpenChange={(o) => !o && closeDialog()}>
        <DlgContent title={`Subscription — ${activeSchool?.name}`}>
          <div className="mt-2 space-y-5">
            {/* Current Plan */}
            <div className="rounded-xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="text-xs text-slate-400 mb-1">Current Plan</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{planStyle(activeSchool?.subscription_plan ?? null).label}</span>
                <span className="text-xs">{formatExpiry(activeSchool?.subscription_expires_at ?? null)}</span>
              </div>
            </div>
            <form onSubmit={handleSubscription} className="space-y-4">
              <Field label="New Plan">
                <Select value={subForm.plan ?? "BASIC"} onValueChange={v=>setSubForm({...subForm,plan:v ?? "BASIC"})}>
                  <SelectTrigger style={inputStyle} className="border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1535] border-slate-700">
                    {([["FREE_TRIAL","Free Trial"],["BASIC","Basic"],["PREMIUM","Premium"],["ENTERPRISE","Enterprise"]] as [string,string][]).map(([v,l])=>(
                      <SelectItem key={v} value={v} className="text-white focus:bg-white/10">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {subForm.plan !== "FREE_TRIAL" && (
                <Field label="Duration">
                  <Select value={subForm.durationMonths ?? "6"} onValueChange={v=>setSubForm({...subForm,durationMonths:v ?? "6"})}>
                    <SelectTrigger style={inputStyle} className="border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1535] border-slate-700">
                      {([["1","1 Month"],["3","3 Months"],["6","6 Months"],["12","1 Year"],["24","2 Years"]] as [string,string][]).map(([v,l])=>(
                        <SelectItem key={v} value={v} className="text-white focus:bg-white/10">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <p className="text-xs text-slate-500">
                {subForm.plan !== "FREE_TRIAL"
                  ? `If the school has an active subscription, the new duration will be added on top of the remaining time.`
                  : "Free Trial has no expiry date."}
              </p>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-700 text-slate-300">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>{isSubmitting ? "Activating..." : "Activate Plan"}</Button>
              </div>
            </form>
          </div>
        </DlgContent>
      </Dialog>
    </div>
  );
}
