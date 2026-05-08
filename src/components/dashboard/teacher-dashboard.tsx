"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CalendarCheck, BookOpen, Clock, ChevronRight,
  GraduationCap, CheckCircle, AlertCircle,
} from "lucide-react";

interface TodaySlot {
  id: string;
  subject: string;
  className: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface Assignment {
  id: string;
  title: string;
  className: string;
  subject: string;
  dueDate: string;
  submissions: number;
}

interface TeacherDashboardProps {
  userName: string;
  myClasses: { id: string; name: string }[];
  studentCount: number;
  todaySlots: TodaySlot[];
  attendanceRate: number | null;
  totalMarked: number;
  assignments: Assignment[];
}

const SLOT_COLORS = [
  "bg-indigo-50 border-indigo-200 text-indigo-900",
  "bg-emerald-50 border-emerald-200 text-emerald-900",
  "bg-violet-50 border-violet-200 text-violet-900",
  "bg-amber-50 border-amber-200 text-amber-900",
  "bg-rose-50 border-rose-200 text-rose-900",
];

export function TeacherDashboard({
  userName,
  myClasses,
  studentCount,
  todaySlots,
  attendanceRate,
  totalMarked,
  assignments,
}: TeacherDashboardProps) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {userName.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/dashboard/attendance" />} size="sm" variant="outline">
            Mark Attendance
          </Button>
          <Button render={<Link href="/dashboard/assignments" />} size="sm">
            New Assignment
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-l-4 border-l-indigo-500 shadow-sm p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 mb-3">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">My Classes</p>
          <p className="text-2xl font-bold">{myClasses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Assigned classes</p>
        </div>

        <div className="bg-card rounded-xl border border-l-4 border-l-violet-500 shadow-sm p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 mb-3">
            <Users className="h-4.5 w-4.5 text-white" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">My Students</p>
          <p className="text-2xl font-bold">{studentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
        </div>

        <div className="bg-card rounded-xl border border-l-4 border-l-emerald-500 shadow-sm p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 mb-3">
            <CalendarCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Attendance Today</p>
          <p className="text-2xl font-bold">
            {attendanceRate !== null ? `${attendanceRate}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalMarked > 0 ? `${totalMarked} marked` : "Not marked yet"}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-l-4 border-l-amber-500 shadow-sm p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 mb-3">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assignments</p>
          <p className="text-2xl font-bold">{assignments.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Today's timetable */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Today's Classes</CardTitle>
                <CardDescription className="text-xs mt-0.5">Your teaching schedule for today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {todaySlots.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                No classes scheduled for today.
              </div>
            ) : (
              todaySlots.map((slot, i) => (
                <div key={slot.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${SLOT_COLORS[i % SLOT_COLORS.length]}`}>
                  <div>
                    <p className="font-semibold">{slot.subject}</p>
                    <p className="text-xs opacity-70 mt-0.5">
                      {slot.className}{slot.room ? ` · ${slot.room}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-medium opacity-80">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
              ))
            )}
            <div className="pt-1">
              <Link href="/dashboard/timetable"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                Full timetable <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* My classes */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                <GraduationCap className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">My Assigned Classes</CardTitle>
                <CardDescription className="text-xs mt-0.5">Classes you are allocated to teach</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {myClasses.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                No classes assigned yet. Contact the administrator.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {myClasses.map((cls) => (
                  <Link key={cls.id} href={`/dashboard/students?class_id=${cls.id}`}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 hover:bg-muted/60 px-3 py-2.5 text-sm font-semibold transition-colors">
                    {cls.name}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
            <div className="pt-3">
              <Link href="/dashboard/students"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                View all students <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent assignments */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">My Assignments</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Assignments you have created</CardDescription>
                </div>
              </div>
              <Button render={<Link href="/dashboard/assignments" />} size="sm" variant="outline">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {assignments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No assignments created yet.
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => {
                  const due = new Date(a.dueDate);
                  const isOverdue = due < new Date();
                  return (
                    <div key={a.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.subject} · {a.className}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {a.submissions} submission{a.submissions !== 1 ? "s" : ""}
                        </span>
                        <Badge
                          variant={isOverdue ? "destructive" : "outline"}
                          className="text-[10px] gap-1 shrink-0">
                          {isOverdue
                            ? <><AlertCircle className="h-3 w-3" /> Overdue</>
                            : <><CheckCircle className="h-3 w-3 text-emerald-500" />{due.toLocaleDateString()}</>
                          }
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
