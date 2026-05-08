"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2, GraduationCap, Users, CreditCard, Save, Upload,
  X, CheckCircle, XCircle, Plus, MoreHorizontal, Shield,
  CalendarDays, Zap, Star, AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchoolProfile {
  id: string;
  name: string;
  motto: string;
  logo: string;
  address: string;
  region: string;
  district: string;
  circuit: string;
  phone: string;
  email: string;
}

interface TermConfig {
  name: string;
  start_date: string;
  end_date: string;
}

interface AcademicConfig {
  current_academic_year: string;
  current_term: string;
  terms: TermConfig[];
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

interface BillingInfo {
  plan_key: string;
  plan: { label: string; sms_quota: number; features: string[] };
  sms_credits: number;
  student_count: number;
  staff_count: number;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "HEADTEACHER", "TEACHER", "ACCOUNTANT", "LIBRARIAN"] as const;
const TERMS = ["1st Term", "2nd Term", "3rd Term"] as const;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  HEADTEACHER: "bg-emerald-100 text-emerald-800",
  TEACHER: "bg-amber-100 text-amber-800",
  ACCOUNTANT: "bg-orange-100 text-orange-800",
  LIBRARIAN: "bg-teal-100 text-teal-800",
};

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: "border-gray-300 bg-gray-50",
  BASIC: "border-blue-300 bg-blue-50",
  PREMIUM: "border-purple-300 bg-purple-50",
  ENTERPRISE: "border-amber-300 bg-amber-50",
};

// ─── Shared Loader ────────────────────────────────────────────────────────────

function SettingsLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [profile, setProfile] = useState<SchoolProfile>({
    id: "", name: "", motto: "", logo: "", address: "",
    region: "", district: "", circuit: "", phone: "", email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/school")
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => toast.error("Failed to load school profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/settings/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProfile((p) => ({ ...p, logo: data.url }));
      toast.success("Logo uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!profile.name.trim()) { toast.error("School name is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("School profile saved.");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof SchoolProfile, v: string) =>
    setProfile((p) => ({ ...p, [k]: v }));

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Logo / Crest */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">School Logo / Crest</CardTitle>
          <CardDescription>
            Used in report PDFs and across the portal. Recommended: square PNG, min 200×200 px, max 2 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            {profile.logo ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.logo}
                  alt="School logo"
                  className="h-24 w-24 rounded-xl object-contain border bg-muted"
                />
                <button
                  type="button"
                  onClick={() => set("logo", "")}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                <Building2 className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              ref={fileRef}
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload Image"}
            </Button>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or SVG · Max 2 MB</p>
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Requires <code className="font-mono bg-amber-50 px-0.5">BLOB_READ_WRITE_TOKEN</code> env var.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label>School Name *</Label>
            <Input value={profile.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. St. Augustine's College" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Motto / Slogan</Label>
            <Input value={profile.motto} onChange={(e) => set("motto", e.target.value)} placeholder="e.g. Knowledge, Character, Service" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Address</Label>
            <Textarea value={profile.address} onChange={(e) => set("address", e.target.value)} placeholder="School physical address" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+233 24 000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={profile.email} onChange={(e) => set("email", e.target.value)} placeholder="admin@school.edu.gh" />
          </div>
        </CardContent>
      </Card>

      {/* GES Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">GES Location Details</CardTitle>
          <CardDescription>Printed on official documents and terminal reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Input value={profile.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Ashanti Region" />
          </div>
          <div className="space-y-1.5">
            <Label>District</Label>
            <Input value={profile.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Kumasi Metro" />
          </div>
          <div className="space-y-1.5">
            <Label>Circuit</Label>
            <Input value={profile.circuit} onChange={(e) => set("circuit", e.target.value)} placeholder="e.g. Circuit 3" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2 min-w-32">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

// ─── Academic Tab ─────────────────────────────────────────────────────────────

function AcademicTab() {
  const router = useRouter();
  const [config, setConfig] = useState<AcademicConfig>({
    current_academic_year: "",
    current_term: "1st Term",
    terms: [
      { name: "1st Term", start_date: "", end_date: "" },
      { name: "2nd Term", start_date: "", end_date: "" },
      { name: "3rd Term", start_date: "", end_date: "" },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/academic")
      .then((r) => r.json())
      .then((d) => { if (d.academic_config) setConfig(d.academic_config); })
      .catch(() => toast.error("Failed to load academic config"))
      .finally(() => setLoading(false));
  }, []);

  const updateTerm = (i: number, key: keyof TermConfig, val: string) =>
    setConfig((c) => {
      const terms = [...c.terms];
      terms[i] = { ...terms[i], [key]: val };
      return { ...c, terms };
    });

  const save = async () => {
    if (!config.current_academic_year.trim()) { toast.error("Academic year is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/academic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Academic configuration saved.");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Active Year & Term */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Academic Period</CardTitle>
          <CardDescription>
            Sets the default active year and term shown across the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Input
              value={config.current_academic_year}
              onChange={(e) => setConfig((c) => ({ ...c, current_academic_year: e.target.value }))}
              placeholder="e.g. 2025/2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Current Term</Label>
            <Select
              value={config.current_term}
              onValueChange={(v) => { if (v) setConfig((c) => ({ ...c, current_term: v })); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Term Date Ranges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Term Calendars</CardTitle>
          <CardDescription>Official start and end dates for each term. Used in attendance and scheduling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.terms.map((term, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                term.name === config.current_term
                  ? "border-blue-300 bg-blue-50/40"
                  : "border-border bg-muted/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{term.name}</span>
                {term.name === config.current_term && (
                  <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">Active</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={term.start_date} onChange={(e) => updateTerm(i, "start_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={term.end_date} onChange={(e) => updateTerm(i, "end_date", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Grading scale pointer */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="flex items-center gap-4 pt-5">
          <GraduationCap className="h-8 w-8 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Grading Scale Configuration</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              GES grade boundaries (1–9) are configured in the Report Template settings.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/settings/report-template")}
          >
            Configure
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2 min-w-40">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Academic Setup"}
        </Button>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", password: "", newRole: "TEACHER" });
  const [inviting, setInviting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/settings/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!invite.name.trim() || !invite.email.trim() || !invite.password.trim()) {
      toast.error("All fields are required.");
      return;
    }
    if (invite.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${invite.name} added as ${invite.newRole}.`);
      setInviteOpen(false);
      setInvite({ name: "", email: "", password: "", newRole: "TEACHER" });
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((us) => us.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success("Role updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((us) =>
        us.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
      toast.success(currentActive ? "User deactivated." : "User reactivated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Staff Accounts</h3>
          <p className="text-sm text-muted-foreground">
            {users.length} staff member{users.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Invite Dialog — controlled, no DialogTrigger needed */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Account</DialogTitle>
            <DialogDescription>
              Create a login for a new staff member. Share the temporary password with them directly — they can change it after first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={invite.name}
                onChange={(e) => setInvite((i) => ({ ...i, name: e.target.value }))}
                placeholder="e.g. Kofi Mensah"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
                placeholder="kofi@school.edu.gh"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={invite.newRole}
                onValueChange={(v) => { if (v) setInvite((i) => ({ ...i, newRole: v })); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase().replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={invite.password}
                onChange={(e) => setInvite((i) => ({ ...i, password: e.target.value }))}
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? "Creating…" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  Loading staff accounts…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                  No staff accounts yet. Add the first one above.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={!user.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-800"}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-emerald-700 text-xs">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs">
                        <XCircle className="h-3.5 w-3.5" /> Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled className="text-xs font-semibold text-muted-foreground">
                          Change Role
                        </DropdownMenuItem>
                        {ROLES.filter((r) => r !== user.role).map((r) => (
                          <DropdownMenuItem key={r} onClick={() => changeRole(user.id, r)} className="text-sm">
                            <Shield className="mr-2 h-3.5 w-3.5" />
                            Set as {r.charAt(0) + r.slice(1).toLowerCase()}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toggleActive(user.id, user.is_active)}
                          className={user.is_active ? "text-destructive" : "text-emerald-700"}
                        >
                          {user.is_active ? (
                            <><XCircle className="mr-2 h-3.5 w-3.5" /> Deactivate</>
                          ) : (
                            <><CheckCircle className="mr-2 h-3.5 w-3.5" /> Reactivate</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/billing")
      .then((r) => r.json())
      .then((d) => setBilling(d))
      .catch(() => toast.error("Failed to load billing info"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SettingsLoader />;
  if (!billing) return null;

  const smsPercent = Math.min(100, Math.round((billing.sms_credits / billing.plan.sms_quota) * 100));
  const smsBar = smsPercent > 50 ? "bg-emerald-500" : smsPercent > 20 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current Plan */}
      <Card className={`border-2 ${PLAN_COLORS[billing.plan_key] ?? "border-border bg-background"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                {billing.plan.label} Plan
              </CardTitle>
              <CardDescription className="mt-1">
                Active since{" "}
                {new Date(billing.created_at).toLocaleDateString("en-GH", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm font-semibold px-3">
              {billing.plan.label.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {billing.plan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {billing.plan_key === "FREE_TRIAL" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Upgrade to unlock full capacity</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Free Trial is limited to 200 students. Upgrade to Basic or Premium to grow without limits.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button disabled className="gap-2">
              <Zap className="h-4 w-4" />
              Upgrade Plan
              <Badge variant="secondary" className="text-xs ml-1">Coming Soon</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS Credits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SMS Credits</CardTitle>
          <CardDescription>Used for automated notifications, fee reminders, and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{billing.sms_credits.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                credits remaining of {billing.plan.sms_quota.toLocaleString()} quota
              </p>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{smsPercent}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${smsBar}`}
              style={{ width: `${smsPercent}%` }}
            />
          </div>
          {billing.sms_credits < 100 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Low credit balance — top up to continue sending notifications.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{billing.student_count.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Students enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-3xl font-bold">{billing.staff_count.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Staff accounts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your school profile, academic calendar, staff accounts, and subscription.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-muted p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> School Profile
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Academic Setup
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Subscription & Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="academic"><AcademicTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="billing"><BillingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
