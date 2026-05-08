"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileEdit, ClipboardCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type Subject = { id: string; name: string; code: string };
type Class = { id: string; name: string };

export default function AssignmentsDashboard() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeTab, setActiveTab] = useState("create");

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    total_marks: "100",
    subject_id: "",
    class_id: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
    ]).then(([s, c]) => {
      setSubjects(Array.isArray(s) ? s : []);
      setClasses(Array.isArray(c) ? c : []);
      if (s.length > 0) setForm(f => ({ ...f, subject_id: s[0].id }));
      if (c.length > 0) setForm(f => ({ ...f, class_id: c[0].id }));
    }).catch(() => toast.error("Failed to load data"));
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.due_date || !form.subject_id || !form.class_id) {
      return toast.error("Title, due date, subject, and class are required.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          total_marks: Number(form.total_marks),
          due_date: new Date(form.due_date).toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Assignment created and dispatched to class.");
        setForm({ title: "", description: "", due_date: "", total_marks: "100", subject_id: subjects[0]?.id || "", class_id: classes[0]?.id || "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create assignment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Create, dispatch, and grade class assignments.</p>
        </div>
        {role && (
          <Badge variant="outline" className="text-sm px-3 py-1 border-primary/40 bg-primary/5 text-primary">
            Role: {role}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 max-w-fit">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" /> Create Assignment
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Grade Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Create Assignment</CardTitle>
              <CardDescription>Assignments will be linked to the selected subject and class.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                    value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                    value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}
                  >
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assignment Title</Label>
                <Input placeholder="e.g. End of Unit Physics Test" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" max={100} value={form.total_marks}
                    onChange={e => setForm({ ...form, total_marks: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instructions (Optional)</Label>
                <Textarea placeholder="Describe the assignment requirements..."
                  className="h-24 resize-none" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter className="pt-2 bg-muted/20 border-t">
              <Button size="lg" className="w-full font-bold" onClick={handleCreate} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create & Dispatch Assignment"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="grading">
          <GradingTab subjects={subjects} classes={classes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GradingTab({ subjects, classes }: { subjects: Subject[]; classes: Class[] }) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { score: string; comment: string }>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const loadStudents = async () => {
    if (!selectedClass) return toast.error("Select a class first.");
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?class_id=${selectedClass}&status=ACTIVE`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        const init: Record<string, { score: string; comment: string }> = {};
        data.forEach((s: any) => { init[s.id] = { score: "", comment: "" }; });
        setScores(init);
      }
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Grade Submissions</CardTitle>
          <CardDescription>Select a class to load students and enter scores.</CardDescription>
        </div>
        <div className="flex gap-2 items-end">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button size="sm" onClick={loadStudents} disabled={loadingStudents}>
            {loadingStudents ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-4">
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Select a class and click Load to see students.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 uppercase text-xs border-b">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Adm No.</th>
                <th className="px-2 py-3 w-[150px]">Score</th>
                <th className="px-2 py-3">Comment</th>
              </tr>
            </thead>
            <tbody>
              {students.map(st => (
                <tr key={st.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-primary">{st.first_name} {st.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{st.admission_number}</td>
                  <td className="px-2 py-2">
                    <div className="relative flex items-center">
                      <Input type="number" max={100} min={0} value={scores[st.id]?.score || ""}
                        onChange={e => setScores(prev => ({ ...prev, [st.id]: { ...prev[st.id], score: e.target.value } }))}
                        className="h-9 font-bold" placeholder="0" />
                      <span className="absolute right-3 text-xs text-muted-foreground font-mono">/ 100</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <Input type="text" placeholder="Add feedback..."
                      className="bg-transparent border-dashed h-9"
                      value={scores[st.id]?.comment || ""}
                      onChange={e => setScores(prev => ({ ...prev, [st.id]: { ...prev[st.id], comment: e.target.value } }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      {students.length > 0 && (
        <CardFooter className="justify-end border-t pt-4 bg-muted/10">
          <Button size="lg" disabled={loading} className="w-[280px] font-bold"
            onClick={() => toast.info("To save grades, link this to an Assignment ID. Create an assignment first.")}>
            Save Grades
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
