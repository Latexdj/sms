"use client";

import { Globe, Save, ToggleLeft, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  borderColor: "rgba(255,255,255,0.12)",
  color: "white",
};

export default function GlobalConfigPage() {
  const [smsCredits, setSmsCredits] = useState(1000);
  const [trialDays, setTrialDays] = useState(30);
  const [maxStudents, setMaxStudents] = useState(500);

  const handleSave = () => toast.success("Global configuration saved!");

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Global Configuration</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
          Manage platform-wide defaults that apply to all newly onboarded tenants.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}
      >
        <Info className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-400">
          Changes here affect all <strong className="text-white">new</strong> schools registered after saving.
          Existing tenant configurations are not modified.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Default Tenant Limits */}
        <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              <Globe className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Default Tenant Limits</h3>
              <p className="text-xs text-slate-500">Applied to all new schools</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">Default SMS Credits</Label>
              <Input
                type="number"
                value={smsCredits}
                onChange={(e) => setSmsCredits(Number(e.target.value))}
                style={inputStyle}
                className="border"
              />
              <p className="text-[11px] text-slate-600">Credits allocated on account creation</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">Free Trial Period (days)</Label>
              <Input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                style={inputStyle}
                className="border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">Max Students (Free Tier)</Label>
              <Input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                style={inputStyle}
                className="border"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="rounded-2xl p-6 space-y-5" style={cardStyle}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}
            >
              <ToggleLeft className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Feature Flags</h3>
              <p className="text-xs text-slate-500">Enable/disable platform features globally</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Paystack Payments", enabled: true },
              { label: "MTN MoMo Payments", enabled: true },
              { label: "Hubtel SMS Integration", enabled: true },
              { label: "PDF Report Generation", enabled: true },
              { label: "Library Module", enabled: false },
              { label: "Cafeteria Module", enabled: false },
            ].map((flag) => (
              <div key={flag.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{flag.label}</span>
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold cursor-pointer"
                  style={
                    flag.enabled
                      ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b" }
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${flag.enabled ? "bg-emerald-500" : "bg-slate-600"}`} />
                  {flag.enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="text-white font-semibold px-6"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none" }}
        >
          <Save className="mr-2 h-4 w-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}
