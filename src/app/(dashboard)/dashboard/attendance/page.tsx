"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";

type ClassItem = { id: string; name: string; level: string };
type StudentItem = { id: string; first_name: string; last_name: string; admission_number: string };

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json())
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load classes"));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendanceState({});
      return;
    }
    setLoadingStudents(true);
    fetch(`/api/students?class_id=${selectedClass}&status=ACTIVE`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        const init: Record<string, string> = {};
        list.forEach((s: StudentItem) => { init[s.id] = "PRESENT"; });
        setAttendanceState(init);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  const handleUpdateStatus = (studentId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass) return toast.error("Please select a class first.");
    if (students.length === 0) return toast.error("No students to mark attendance for.");

    setLoading(true);
    const records = Object.keys(attendanceState).map(id => ({
      studentId: id,
      status: attendanceState[id],
    }));

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClass, date: targetDate, records }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Attendance saved. ${data.AbsencesFired} absence alert(s) sent.`);
      } else {
        toast.error(data.error || "Failed to save attendance");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PRESENT: "bg-emerald-500 hover:bg-emerald-600 text-white",
    ABSENT: "bg-destructive hover:bg-destructive/90 text-white",
    LATE: "bg-amber-500 hover:bg-amber-600 text-white",
    EXCUSED: "bg-blue-500 hover:bg-blue-600 text-white",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Register</h2>
        <p className="text-muted-foreground">Mark daily class attendance. Absent students trigger automatic parent SMS alerts.</p>
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="register" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Daily Register
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Records are upserted — resubmitting overwrites previous entries for the same date.</CardDescription>
              </div>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[160px]"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-[150px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {selectedClass ? "No active students in this class." : "Select a class to begin marking attendance."}
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map(student => (
                    <div key={student.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/20 transition-colors">
                      <div>
                        <p className="font-semibold">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                      </div>
                      <div className="flex gap-2">
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map(statusStr => (
                          <Button
                            key={statusStr}
                            size="sm"
                            className={attendanceState[student.id] === statusStr ? statusColors[statusStr] : ""}
                            variant={attendanceState[student.id] === statusStr ? "default" : "outline"}
                            onClick={() => handleUpdateStatus(student.id, statusStr)}
                          >
                            {statusStr}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 flex justify-end">
                    <Button size="lg" onClick={handleSubmit} disabled={loading} className="w-full sm:w-[250px] font-bold">
                      {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Submit Attendance"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
