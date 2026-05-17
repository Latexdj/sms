"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Search, MoreVertical, Trash, PauseCircle,
  PlayCircle, Eye, Building2, Users, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type School = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subscription_plan: string | null;
  created_at: string;
  _count: { users: number; students: number };
};

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  FREE_TRIAL: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", label: "Free Trial" },
  BASIC: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.3)", label: "Basic" },
  PREMIUM: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", border: "rgba(139,92,246,0.4)", label: "Premium" },
  ENTERPRISE: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.3)", label: "Enterprise" },
};

export default function SchoolsManagement() {
  const { data: session } = useSession();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "",
    adminName: "", adminEmail: "", adminPassword: "",
  });

  const fetchSchools = async (search = "") => {
    setIsLoading(true);
    try {
      const url = new URL("/api/super-admin/schools", window.location.origin);
      if (search) url.searchParams.append("search", search);
      const res = await fetch(url.toString());
      if (res.ok) setSchools(await res.json());
    } catch { } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") fetchSchools();
  }, [session]);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddDialogOpen(false);
        setFormData({ name: "", email: "", phone: "", address: "", adminName: "", adminEmail: "", adminPassword: "" });
        fetchSchools();
        toast.success("School created successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create school");
      }
    } catch { toast.error("An unexpected error occurred"); }
    finally { setIsAdding(false); }
  };

  const planStyle = (plan: string | null) =>
    PLAN_STYLES[plan ?? "FREE_TRIAL"] ?? PLAN_STYLES.FREE_TRIAL;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Schools Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
            Create, manage, suspend or remove schools from the platform.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="font-semibold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none" }}
            >
              <Plus className="mr-2 h-4 w-4" /> Register School
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto border-slate-800"
            style={{ background: "#1a1535", color: "white" }}
          >
            <DialogHeader>
              <DialogTitle className="text-white">Register New School</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSchool} className="space-y-6 mt-2">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-violet-400 border-b border-violet-900 pb-2">
                  School Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "School Name", key: "name", required: true },
                    { label: "School Email", key: "email", type: "email" },
                    { label: "Phone", key: "phone" },
                    { label: "Address", key: "address" },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-slate-400">{f.label}</Label>
                      <Input
                        type={f.type ?? "text"}
                        required={f.required}
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="border-slate-700 bg-white/5 text-white placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-violet-400 border-b border-violet-900 pb-2">
                  Admin Account
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Admin Name", key: "adminName", required: true },
                    { label: "Admin Email", key: "adminEmail", type: "email", required: true },
                    { label: "Password", key: "adminPassword", type: "password", required: true },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-slate-400">{f.label}</Label>
                      <Input
                        type={f.type ?? "text"}
                        required={f.required}
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="border-slate-700 bg-white/5 text-white placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-700 text-slate-300">
                  Cancel
                </Button>
                <Button
                  type="submit" disabled={isAdding}
                  className="text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  {isAdding ? "Creating..." : "Create School"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <Input
          placeholder="Search schools by name, email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value === "") fetchSchools(); }}
          onKeyDown={(e) => e.key === "Enter" && fetchSchools(searchQuery)}
          className="border-0 bg-transparent text-white placeholder:text-slate-600 focus-visible:ring-0 p-0 h-auto text-sm"
        />
      </div>

      {/* Schools Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.6)" }}
        >
          <span>School</span>
          <span>Plan</span>
          <span><Users className="h-3 w-3 inline mr-1" />Staff</span>
          <span><GraduationCap className="h-3 w-3 inline mr-1" />Students</span>
          <span>Joined</span>
          <span></span>
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              <span className="text-sm text-slate-500">Loading schools...</span>
            </div>
          </div>
        ) : schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Building2 className="h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-600">No schools found. Register your first school to get started.</p>
          </div>
        ) : (
          schools.map((school, i) => {
            const ps = planStyle(school.subscription_plan);
            return (
              <div
                key={school.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">{school.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{school.email ?? "No email"}</div>
                </div>
                <div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}
                  >
                    {ps.label}
                  </span>
                </div>
                <span className="text-sm text-slate-300">{school._count.users}</span>
                <span className="text-sm text-slate-300">{school._count.students}</span>
                <span className="text-sm text-slate-500">
                  {new Date(school.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-slate-800 bg-[#1a1535]">
                    <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2">
                      <Eye className="h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2">
                      <PauseCircle className="h-4 w-4 text-amber-400" /> Suspend School
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/10 cursor-pointer gap-2">
                      <PlayCircle className="h-4 w-4 text-emerald-400" /> Reactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer gap-2">
                      <Trash className="h-4 w-4" /> Delete School
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
