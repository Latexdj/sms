"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Building2, Users, GraduationCap, ChevronRight, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  FREE_TRIAL: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", label: "Free Trial" },
  BASIC:      { bg: "rgba(59,130,246,0.1)",  text: "#60a5fa",  border: "rgba(59,130,246,0.3)",  label: "Basic" },
  PREMIUM:    { bg: "rgba(139,92,246,0.15)", text: "#a78bfa",  border: "rgba(139,92,246,0.4)",  label: "Premium" },
  ENTERPRISE: { bg: "rgba(16,185,129,0.1)",  text: "#34d399",  border: "rgba(16,185,129,0.3)",  label: "Enterprise" },
};

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "white" };

export default function SchoolsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setIsAdding(true);
    try {
      const res = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowRegister(false);
        fetchSchools();
        toast.success("School registered successfully!");
        setForm({ name: "", email: "", phone: "", address: "", adminName: "", adminEmail: "", adminPassword: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create school");
      }
    } catch { toast.error("Unexpected error"); }
    finally { setIsAdding(false); }
  };

  const planStyle = (plan: string | null) => PLAN_STYLES[plan ?? "FREE_TRIAL"] ?? PLAN_STYLES.FREE_TRIAL;

  const formatExpiry = (date: string | null) => {
    if (!date) return { text: "No expiry", expired: false };
    const d = new Date(date);
    return {
      text: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      expired: d < new Date(),
    };
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Schools Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
            {schools.length} school{schools.length !== 1 ? "s" : ""} on the platform. Click a school to manage it.
          </p>
        </div>
        <Button
          className="font-semibold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none" }}
          onClick={() => setShowRegister(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Register School
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={cardStyle}>
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <Input
          placeholder="Search schools by name or email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) fetchSchools(); }}
          onKeyDown={(e) => e.key === "Enter" && fetchSchools(searchQuery)}
          className="border-0 bg-transparent text-white placeholder:text-slate-600 focus-visible:ring-0 p-0 h-auto text-sm"
        />
      </div>

      {/* School Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <span className="text-sm text-slate-500">Loading schools...</span>
          </div>
        </div>
      ) : schools.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3" style={cardStyle}>
          <Building2 className="h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-600">No schools found. Register your first school to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => {
            const ps = planStyle(school.subscription_plan);
            const expiry = formatExpiry(school.subscription_expires_at);
            return (
              <div
                key={school.id}
                onClick={() => router.push(`/super-admin/schools/${school.id}`)}
                className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => (e.currentTarget.style.border = "1px solid rgba(139,92,246,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
              >
                {/* Status dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: school.is_active ? "#10b981" : "#ef4444", boxShadow: school.is_active ? "0 0 6px #10b981" : "0 0 6px #ef4444" }}
                  />
                  <span className="text-[11px] font-medium" style={{ color: school.is_active ? "#34d399" : "#f87171" }}>
                    {school.is_active ? "Active" : "Suspended"}
                  </span>
                </div>

                {/* School icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                  style={{ background: "linear-gradient(135deg, #7c3aed22, #4f46e522)", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <Building2 className="h-5 w-5 text-violet-400" />
                </div>

                {/* Name + email */}
                <h3 className="text-base font-bold text-white leading-tight pr-16">{school.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">{school.email ?? "No email"}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">{school._count.users} staff</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">{school._count.students} students</span>
                  </div>
                </div>

                {/* Plan + expiry */}
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}
                  >
                    {ps.label}
                  </span>
                  {school.subscription_expires_at && (
                    <span className="text-[11px]" style={{ color: expiry.expired ? "#f87171" : "#64748b" }}>
                      {expiry.expired ? "Expired " : "Until "}{expiry.text}
                    </span>
                  )}
                </div>

                {/* Click hint */}
                <div
                  className="absolute bottom-4 right-4 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#a78bfa" }}
                >
                  Manage <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register School Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent
          className="max-w-xl max-h-[90vh] overflow-y-auto border-slate-800"
          style={{ background: "#1a1535", color: "white" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Register New School</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-5 mt-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 border-b border-violet-900 pb-1.5">School Details</p>
              <div className="grid grid-cols-2 gap-3">
                {([["School Name", "name", true], ["Email", "email", false, "email"], ["Phone", "phone"], ["Address", "address"]] as any[]).map(([l, k, req, t]: any) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-xs text-slate-400">{l}</Label>
                    <Input type={t ?? "text"} required={!!req} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inputStyle} className="border" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 border-b border-violet-900 pb-1.5">First Admin Account</p>
              <div className="grid grid-cols-2 gap-3">
                {([["Admin Name", "adminName", true], ["Admin Email", "adminEmail", true, "email"], ["Password", "adminPassword", true, "password"]] as any[]).map(([l, k, req, t]: any) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-xs text-slate-400">{l}</Label>
                    <Input type={t ?? "text"} required={!!req} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inputStyle} className="border" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setShowRegister(false)} className="border-slate-700 text-slate-300">Cancel</Button>
              <Button type="submit" disabled={isAdding} className="text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                {isAdding ? "Creating..." : "Create School"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
