"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings2, Save, Plus, Trash2, GripVertical, FileText,
  LayoutTemplate, BookOpen, Star, PenLine, Eye, EyeOff,
} from "lucide-react";
import { TerminalReportDownloadButton, type ReportConfig } from "@/components/reports/terminal-report-pdf";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ReportConfig = {
  crest_position: "left",
  headteacher_name: "",
  next_term_date: "",
  show_position: true,
  show_grading_scale: true,
  subject_groupings: [
    { name: "Core Subjects", subjects: [] },
    { name: "Elective Subjects", subjects: [] },
  ],
  conduct_fields: [
    { label: "Punctuality" },
    { label: "Neatness" },
    { label: "Conduct" },
    { label: "Attitude to Work" },
    { label: "Homework" },
  ],
  signature_fields: [
    { title: "Class Teacher", name: "" },
    { title: "Headteacher", name: "" },
  ],
  grading_scale: [
    { grade: 1, min: 80, max: 100, remark: "Highest" },
    { grade: 2, min: 70, max: 79, remark: "Higher" },
    { grade: 3, min: 65, max: 69, remark: "High" },
    { grade: 4, min: 60, max: 64, remark: "High Average" },
    { grade: 5, min: 55, max: 59, remark: "Average" },
    { grade: 6, min: 50, max: 54, remark: "Low Average" },
    { grade: 7, min: 45, max: 49, remark: "Low" },
    { grade: 8, min: 40, max: 44, remark: "Lower" },
    { grade: 9, min: 0, max: 39, remark: "Lowest" },
  ],
};

// ─── Mock preview data ─────────────────────────────────────────────────────────

const PREVIEW_REPORT = {
  student: { id: "s1", name: "Kofi Mensah", admission: "JHS-001", gender: "Male" },
  grades: [
    { subject_id: "sub1", subject: "Mathematics", class_score: 24.5, exam_score: 58.0, total: 82.5, grade: 1, remark: "Highest" },
    { subject_id: "sub2", subject: "English Language", class_score: 22.0, exam_score: 52.0, total: 74.0, grade: 2, remark: "Higher" },
    { subject_id: "sub3", subject: "Integrated Science", class_score: 20.0, exam_score: 48.0, total: 68.0, grade: 3, remark: "High" },
    { subject_id: "sub4", subject: "Social Studies", class_score: 18.5, exam_score: 44.0, total: 62.5, grade: 4, remark: "High Average" },
  ],
  overall_total: 287.0,
  average: 71.75,
  position: 3,
  total_in_class: 45,
  subject_count: 4,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportTemplatePage() {
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved config
  useEffect(() => {
    fetch("/api/reports/template")
      .then((r) => r.json())
      .then((data) => {
        if (data.report_config) setConfig({ ...DEFAULT_CONFIG, ...data.report_config });
        if (data.school) setSchool(data.school);
      })
      .catch(() => toast.error("Could not load template config"))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/reports/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Template configuration saved successfully.");
    } catch {
      toast.error("Failed to save template config.");
    } finally {
      setSaving(false);
    }
  }, [config]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateField = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  // Conduct fields
  const addConduct = () =>
    updateField("conduct_fields", [...config.conduct_fields, { label: "" }]);
  const removeConduct = (i: number) =>
    updateField("conduct_fields", config.conduct_fields.filter((_, idx) => idx !== i));
  const updateConduct = (i: number, label: string) =>
    updateField(
      "conduct_fields",
      config.conduct_fields.map((f, idx) => (idx === i ? { label } : f))
    );

  // Signature fields
  const addSignature = () =>
    updateField("signature_fields", [...config.signature_fields, { title: "", name: "" }]);
  const removeSignature = (i: number) =>
    updateField("signature_fields", config.signature_fields.filter((_, idx) => idx !== i));
  const updateSignature = (i: number, key: "title" | "name", val: string) =>
    updateField(
      "signature_fields",
      config.signature_fields.map((s, idx) => (idx === i ? { ...s, [key]: val } : s))
    );

  // Subject groupings
  const addGroup = () =>
    updateField("subject_groupings", [...config.subject_groupings, { name: "", subjects: [] }]);
  const removeGroup = (i: number) =>
    updateField("subject_groupings", config.subject_groupings.filter((_, idx) => idx !== i));
  const updateGroupName = (i: number, name: string) =>
    updateField(
      "subject_groupings",
      config.subject_groupings.map((g, idx) => (idx === i ? { ...g, name } : g))
    );
  const updateGroupSubjects = (i: number, raw: string) => {
    const subjects = raw.split(",").map((s) => s.trim()).filter(Boolean);
    updateField(
      "subject_groupings",
      config.subject_groupings.map((g, idx) => (idx === i ? { ...g, subjects } : g))
    );
  };

  // Grading scale
  const updateGradeRow = (i: number, key: "min" | "max" | "remark", val: string) =>
    updateField(
      "grading_scale",
      config.grading_scale.map((g, idx) =>
        idx === i ? { ...g, [key]: key === "remark" ? val : Number(val) } : g
      )
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm animate-pulse">Loading template config...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
            Terminal Report Template
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the GES-standard terminal report layout. Changes apply to all newly generated PDFs.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>

      <Tabs defaultValue="layout" className="space-y-4">
        <TabsList className="bg-muted p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="layout" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Layout
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Subject Groups
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Grading Scale
          </TabsTrigger>
          <TabsTrigger value="conduct" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Conduct Fields
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-1.5">
            <PenLine className="h-3.5 w-3.5" /> Signatures
          </TabsTrigger>
        </TabsList>

        {/* ── Layout Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="layout">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crest Position */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">School Crest Position</CardTitle>
                <CardDescription>Controls where the school logo appears in the report header.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {(["left", "center", "right"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateField("crest_position", pos)}
                      className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                        config.crest_position === pos
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-muted hover:border-blue-300"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Left</strong> — crest beside school name (standard GES layout).
                </p>
              </CardContent>
            </Card>

            {/* Display Toggles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Report Display Options</CardTitle>
                <CardDescription>Toggle which sections appear on the report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "show_position" as const, label: "Show Position in Class", desc: "e.g. 3rd out of 45" },
                  { key: "show_grading_scale" as const, label: "Show Grading Scale Table", desc: "Grade 1–9 reference at bottom" },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    onClick={() => updateField(key, !config[key])}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      config[key] ? "border-green-300 bg-green-50" : "border-muted bg-muted/30"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {config[key] ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Headteacher Name */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Headteacher</CardTitle>
                <CardDescription>Headteacher's name printed under the signature line.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="ht-name">Headteacher Name</Label>
                  <Input
                    id="ht-name"
                    placeholder="e.g. Mr. Kwame Asante"
                    value={config.headteacher_name}
                    onChange={(e) => updateField("headteacher_name", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Next Term Date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next Term Reopening</CardTitle>
                <CardDescription>Displayed in the report footer.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="next-term">Reopening Date</Label>
                  <Input
                    id="next-term"
                    placeholder="e.g. Monday, 14th January 2026"
                    value={config.next_term_date}
                    onChange={(e) => updateField("next_term_date", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter as a readable date string — it will be printed as-is.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Subject Groups Tab ─────────────────────────────────────────────── */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subject Groupings</CardTitle>
              <CardDescription>
                Group subjects into sections on the report (e.g. Core Subjects, Elective Subjects).
                Enter subject names exactly as stored in the system, comma-separated.
                Subjects not matched to any group appear under "Other Subjects".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.subject_groupings.map((group, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Group Name</Label>
                        <Input
                          placeholder="e.g. Core Subjects"
                          value={group.name}
                          onChange={(e) => updateGroupName(i, e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Subjects (comma-separated)</Label>
                        <Input
                          placeholder="Mathematics, English Language, Science"
                          value={group.subjects.join(", ")}
                          onChange={(e) => updateGroupSubjects(i, e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeGroup(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {group.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {group.subjects.map((s, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addGroup} className="gap-2">
                <Plus className="h-4 w-4" /> Add Subject Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Grading Scale Tab ──────────────────────────────────────────────── */}
        <TabsContent value="grading">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GES Grading Scale</CardTitle>
              <CardDescription>
                Configure the grade boundaries and remarks shown at the bottom of the report.
                The default follows the official GES Grade 1–9 scale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium w-16">Grade</th>
                      <th className="text-left p-2 font-medium">Min Score</th>
                      <th className="text-left p-2 font-medium">Max Score</th>
                      <th className="text-left p-2 font-medium">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.grading_scale.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <Badge variant="outline" className="font-mono">
                            {row.grade}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={row.min}
                            onChange={(e) => updateGradeRow(i, "min", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 w-20"
                            value={row.max}
                            onChange={(e) => updateGradeRow(i, "max", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8"
                            value={row.remark}
                            onChange={(e) => updateGradeRow(i, "remark", e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Standard GES boundaries: Grade 1 (80–100 Highest) through Grade 9 (0–39 Lowest).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conduct Fields Tab ─────────────────────────────────────────────── */}
        <TabsContent value="conduct">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conduct / Attitude Fields</CardTitle>
              <CardDescription>
                These fields appear as blank lines on the report for the class teacher to fill in manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.conduct_fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="e.g. Punctuality"
                    value={field.label}
                    onChange={(e) => updateConduct(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => removeConduct(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addConduct} className="gap-2">
                <Plus className="h-4 w-4" /> Add Field
              </Button>
              <p className="text-xs text-muted-foreground pt-1">
                Each field renders as a dotted line the teacher fills in during distribution.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Signatures Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signature Fields</CardTitle>
              <CardDescription>
                Configure signature blocks at the bottom of the report.
                Optionally pre-fill the name to have it printed beneath the signature line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.signature_fields.map((sig, i) => (
                <div key={i} className="border rounded-lg p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-6">#{i + 1}</span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Title / Role</Label>
                        <Input
                          placeholder="e.g. Class Teacher"
                          value={sig.title}
                          onChange={(e) => updateSignature(i, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Name (optional)</Label>
                        <Input
                          placeholder="Leave blank for handwritten"
                          value={sig.name}
                          onChange={(e) => updateSignature(i, "name", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeSignature(i)}
                      disabled={config.signature_fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSignature} className="gap-2">
                <Plus className="h-4 w-4" /> Add Signature Field
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Preview Section ──────────────────────────────────────────────────── */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-800">Preview Report PDF</CardTitle>
          <CardDescription>
            Generate a sample report with dummy student data using your current template configuration.
            Save the template first to persist your changes before generating real reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4 flex-wrap">
          <TerminalReportDownloadButton
            report={PREVIEW_REPORT}
            school={school ?? { name: "Sample School", motto: "Excellence in Education" }}
            config={config}
            term="1st Term"
            academicYear="2025/2026"
            className="JHS 1A"
            noOnRoll={45}
          />
          <p className="text-xs text-muted-foreground">
            Uses sample student data · reflects your unsaved changes instantly
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
