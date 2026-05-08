"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GraduationCap, FileText, Download, Loader2, PlusCircle } from "lucide-react";
import { compileRowTotals } from "@/lib/grading";

type Exam = { id: string; name: string; term: string; academic_year: string; type: string };
type Class = { id: string; name: string; level: string };
type Subject = { id: string; name: string; code: string };
type ResultRow = {
  student_id: string;
  name: string;
  admission_number: string;
  class_score: number;
  exam_score: number;
  total: number;
  grade: number;
  remark: string;
};

export default function ExaminationsDashboard() {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [grades, setGrades] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // New exam form
  const [newExam, setNewExam] = useState({ name: "", term: "Term 1", academic_year: "2024/2025", type: "END_OF_TERM" });
  const [creatingExam, setCreatingExam] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/exams").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/subjects").then(r => r.json()),
    ]).then(([e, c, s]) => {
      setExams(Array.isArray(e) ? e : []);
      setClasses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
    }).catch(() => toast.error("Failed to load data"));
  }, []);

  const loadResults = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      return toast.error("Please select an exam, class, and subject.");
    }
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/exams/results?exam_id=${selectedExam}&class_id=${selectedClass}&subject_id=${selectedSubject}`);
      if (res.ok) {
        const data = await res.json();
        setGrades(data.rows || []);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to load results");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleScoreChange = (index: number, field: "class_score" | "exam_score", value: string) => {
    const max = field === "class_score" ? 30 : 70;
    const num = Math.min(Math.max(parseFloat(value) || 0, 0), max);
    setGrades(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: num };
      const matrix = compileRowTotals(
        field === "class_score" ? num : updated[index].class_score,
        field === "exam_score" ? num : updated[index].exam_score
      );
      updated[index].total = matrix.total;
      updated[index].grade = matrix.grade;
      updated[index].remark = matrix.remark;
      return updated;
    });
  };

  const saveResults = async () => {
    if (!selectedExam || !selectedSubject || grades.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/exams/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: selectedExam,
          subject_id: selectedSubject,
          rows: grades.map(g => ({ student_id: g.student_id, class_score: g.class_score, exam_score: g.exam_score })),
        }),
      });
      if (res.ok) {
        toast.success("Exam results saved successfully.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save results");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const createExam = async () => {
    if (!newExam.name || !newExam.term || !newExam.academic_year) return toast.error("Fill in all fields.");
    setCreatingExam(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExam),
      });
      if (res.ok) {
        const exam = await res.json();
        setExams(prev => [...prev, exam]);
        setNewExam({ name: "", term: "Term 1", academic_year: "2024/2025", type: "END_OF_TERM" });
        toast.success("Exam created successfully.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create exam");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreatingExam(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Academic Grading Centre</h2>
        <p className="text-muted-foreground">Manage exams and enter scores per subject and class.</p>
      </div>

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Score Entry
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Create Exam
          </TabsTrigger>
          <TabsTrigger value="terminal" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Terminal Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>Enter Exam Scores</CardTitle>
              <CardDescription>Select exam, class, and subject then load students to enter scores (Class: 30, Exam: 70).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Exam</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedExam}
                    onChange={e => setSelectedExam(e.target.value)}
                  >
                    <option value="">Select exam...</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadResults} disabled={loadingResults} className="w-full">
                    {loadingResults ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</> : "Load Students"}
                  </Button>
                </div>
              </div>

              {grades.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 uppercase text-xs border-b">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Adm No.</th>
                        <th className="px-2 py-3 w-[110px] text-center">Class (30)</th>
                        <th className="px-2 py-3 w-[110px] text-center">Exam (70)</th>
                        <th className="px-2 py-3 w-[80px] text-center">Total</th>
                        <th className="px-2 py-3 w-[60px] text-center">Grade</th>
                        <th className="px-4 py-3 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((row, idx) => (
                        <tr key={row.student_id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-semibold">{row.name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{row.admission_number}</td>
                          <td className="px-2 py-2">
                            <Input type="number" max={30} min={0} value={row.class_score}
                              onChange={e => handleScoreChange(idx, "class_score", e.target.value)}
                              className="h-8 text-center" />
                          </td>
                          <td className="px-2 py-2">
                            <Input type="number" max={70} min={0} value={row.exam_score}
                              onChange={e => handleScoreChange(idx, "exam_score", e.target.value)}
                              className="h-8 text-center" />
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-lg">{row.total}</td>
                          <td className="px-2 py-3 text-center">
                            <span className={`px-2 py-1 rounded inline-flex items-center justify-center min-w-[30px] font-bold text-xs ${row.grade <= 3 ? "bg-emerald-100 text-emerald-800" : row.grade >= 8 ? "bg-destructive/20 text-destructive" : "bg-blue-100 text-blue-800"}`}>
                              {row.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground font-semibold">{row.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {grades.length === 0 && !loadingResults && (
                <div className="text-center py-8 text-muted-foreground">
                  Select an exam, class, and subject then click "Load Students".
                </div>
              )}
            </CardContent>
            {grades.length > 0 && (
              <CardFooter className="justify-end border-t pt-4">
                <Button size="lg" onClick={saveResults} disabled={loading} className="w-[220px]">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Exam Results"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Create New Exam</CardTitle>
              <CardDescription>Register an exam in the system before entering scores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exam Name</Label>
                <Input placeholder="e.g. End of Term 1 Examination" value={newExam.name}
                  onChange={e => setNewExam({ ...newExam, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Term</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newExam.term} onChange={e => setNewExam({ ...newExam, term: e.target.value })}>
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input placeholder="2024/2025" value={newExam.academic_year}
                    onChange={e => setNewExam({ ...newExam, academic_year: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newExam.type} onChange={e => setNewExam({ ...newExam, type: e.target.value })}>
                  <option value="END_OF_TERM">End of Term</option>
                  <option value="MID_TERM">Mid Term</option>
                  <option value="CLASS_TEST">Class Test</option>
                  <option value="MOCK">Mock</option>
                  <option value="BECE_PREDICTION">BECE Prediction</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={createExam} disabled={creatingExam}>
                {creatingExam ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Exam"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="terminal">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Generate Terminal Report PDFs</CardTitle>
              <CardDescription>Generate the official GES terminal report cards for students. Configure the report template in Settings → Report Template.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Select an exam and class, then use the Reports section to generate individual or bulk PDF report cards.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/dashboard/settings/report-template"}>
                <Download className="mr-2 h-4 w-4" /> Configure Report Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
