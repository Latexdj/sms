"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarRange, PlusCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type TimetableSlot = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string };
  teacher: { id: string; name: string };
};

type Subject = { id: string; name: string; code: string };
type Class = { id: string; name: string };
type Teacher = { id: string; name: string };

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const SLOT_COLORS = [
  "bg-blue-100 text-blue-900 border-blue-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-violet-100 text-violet-900 border-violet-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-cyan-100 text-cyan-900 border-cyan-200",
];

export default function TimetableDashboard() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [activeTab, setActiveTab] = useState(role === "TEACHER" ? "my_schedule" : "editor");

  const [entryForm, setEntryForm] = useState({
    subjectId: "",
    teacherId: "",
    classId: "",
    dayOfWeek: "MONDAY",
    startTime: "08:00",
    endTime: "09:30",
    room: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/subjects").then(r => r.json()),
      fetch("/api/teachers").then(r => r.json()),
    ]).then(([cls, subs, tchs]) => {
      setClasses(Array.isArray(cls) ? cls : []);
      setSubjects(Array.isArray(subs) ? subs : []);
      const teacherList = Array.isArray(tchs) ? tchs.map((t: any) => ({ id: t.user?.id || t.id, name: t.user?.name || t.name })) : [];
      setTeachers(teacherList);
      if (cls.length > 0) {
        setSelectedClass(cls[0].id);
        setEntryForm(f => ({ ...f, classId: cls[0].id }));
      }
      if (subs.length > 0) setEntryForm(f => ({ ...f, subjectId: subs[0].id }));
      if (teacherList.length > 0) setEntryForm(f => ({ ...f, teacherId: teacherList[0].id }));
    }).catch(() => toast.error("Failed to load data"));
  }, []);

  useEffect(() => {
    if (selectedClass) fetchSlots(selectedClass);
  }, [selectedClass]);

  const fetchSlots = async (classId: string) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/timetable?class_id=${classId}`);
      if (res.ok) setSlots(await res.json());
    } catch {
      toast.error("Failed to load timetable");
    } finally {
      setFetching(false);
    }
  };

  const fetchMySchedule = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/timetable");
      if (res.ok) setSlots(await res.json());
    } catch {
      toast.error("Failed to load schedule");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (role === "TEACHER") fetchMySchedule();
  }, [role]);

  const handleBooking = async () => {
    if (!entryForm.classId || !entryForm.subjectId || !entryForm.teacherId) {
      return toast.error("Class, subject, and teacher are required.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: entryForm.classId,
          subjectId: entryForm.subjectId,
          teacherId: entryForm.teacherId,
          dayOfWeek: entryForm.dayOfWeek,
          startTime: entryForm.startTime,
          endTime: entryForm.endTime,
          room: entryForm.room || undefined,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Slot added to timetable.");
        if (entryForm.classId === selectedClass) fetchSlots(selectedClass);
      } else {
        toast.error(result.error || "Failed to add slot");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const slotsForDay = (day: string) => slots.filter(s => s.day_of_week === day);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-muted-foreground">Manage class schedules and teacher assignments.</p>
        </div>
        {role && (
          <Badge variant="outline" className="text-sm px-3 py-1 border-primary/40 bg-primary/5 text-primary">
            {role}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); if (v === "my_schedule") fetchMySchedule(); }} className="space-y-4">
        <TabsList className="bg-muted p-1 max-w-fit">
          {role !== "TEACHER" && (
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Class Grid Editor
            </TabsTrigger>
          )}
          <TabsTrigger value="my_schedule" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-emerald-500" /> {role === "TEACHER" ? "My Schedule" : "View Schedule"}
          </TabsTrigger>
        </TabsList>

        {role !== "TEACHER" && (
          <TabsContent value="editor">
            <div className="grid gap-6 md:grid-cols-[1fr_340px]">
              {/* Timetable Grid */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle>Class Timetable</CardTitle>
                    <CardDescription>Weekly schedule for the selected class.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedClass}
                      onChange={e => setSelectedClass(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {fetching ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    DAYS.map(day => (
                      <div key={day} className="border rounded-md p-3">
                        <h4 className="font-bold text-xs tracking-widest uppercase text-primary/70 mb-3 pb-1 border-b">{day}</h4>
                        <div className="flex gap-2 flex-wrap min-h-[50px]">
                          {slotsForDay(day).length === 0 ? (
                            <div className="text-xs text-muted-foreground flex items-center italic opacity-60 border border-dashed rounded px-3 py-2 w-full justify-center bg-muted/10">
                              No slots assigned.
                            </div>
                          ) : (
                            slotsForDay(day).map((slot, idx) => (
                              <div
                                key={slot.id}
                                className={`shrink-0 w-[160px] border rounded p-2 text-xs ${SLOT_COLORS[idx % SLOT_COLORS.length]}`}
                              >
                                <p className="font-bold font-mono">{slot.start_time} – {slot.end_time}</p>
                                <p className="font-bold uppercase mt-1 leading-tight">{slot.subject.name}</p>
                                <p className="opacity-70 mt-0.5">{slot.teacher.name}{slot.room ? ` | ${slot.room}` : ""}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Add Slot Form */}
              <Card className="h-fit shadow-sm">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Slot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <select
                      className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={entryForm.classId}
                      onChange={e => setEntryForm({ ...entryForm, classId: e.target.value })}
                    >
                      <option value="">Select class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <select
                      className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={entryForm.subjectId}
                      onChange={e => setEntryForm({ ...entryForm, subjectId: e.target.value })}
                    >
                      <option value="">Select subject...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <select
                      className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={entryForm.teacherId}
                      onChange={e => setEntryForm({ ...entryForm, teacherId: e.target.value })}
                    >
                      <option value="">Select teacher...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <select
                      className="flex w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={entryForm.dayOfWeek}
                      onChange={e => setEntryForm({ ...entryForm, dayOfWeek: e.target.value })}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" value={entryForm.startTime}
                        onChange={e => setEntryForm({ ...entryForm, startTime: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" value={entryForm.endTime}
                        onChange={e => setEntryForm({ ...entryForm, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Room (Optional)</Label>
                    <Input placeholder="e.g. Block A, Room 4" value={entryForm.room}
                      onChange={e => setEntryForm({ ...entryForm, room: e.target.value })} />
                  </div>
                  <Button className="w-full font-bold" size="lg" onClick={handleBooking} disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Add to Timetable"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="my_schedule">
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-emerald-500" /> Weekly Schedule
              </CardTitle>
              <CardDescription>
                {role === "TEACHER" ? "Your assigned teaching slots." : "Select a class to view its full schedule."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {role !== "TEACHER" && (
                <div className="flex items-center gap-2 pb-2">
                  <Label className="shrink-0">View class:</Label>
                  <select
                    value={selectedClass}
                    onChange={e => { setSelectedClass(e.target.value); fetchSlots(e.target.value); }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {fetching ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No timetable slots found.</div>
              ) : (
                DAYS.map(day => {
                  const daySlots = slotsForDay(day);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={day} className="border rounded-md p-3">
                      <h4 className="font-bold text-xs tracking-widest uppercase text-primary/70 mb-3 pb-1 border-b">{day}</h4>
                      <div className="space-y-2">
                        {daySlots.map((slot, idx) => (
                          <div key={slot.id} className={`flex justify-between items-center border rounded px-3 py-2 text-sm ${SLOT_COLORS[idx % SLOT_COLORS.length]}`}>
                            <div>
                              <span className="font-bold">{slot.subject.name}</span>
                              <span className="text-xs ml-2 opacity-70">{slot.class.name}</span>
                              {slot.room && <span className="text-xs ml-2 opacity-70">| {slot.room}</span>}
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-xs">{slot.start_time} – {slot.end_time}</p>
                              <p className="text-xs opacity-70">{slot.teacher.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
