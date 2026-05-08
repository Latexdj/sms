"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, TrendingUp, CalendarCheck, ArrowUpRight } from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

interface AdminDashboardProps {
  userName: string;
  academicYear: string;
  term: string;
  totalStudents: number;
  totalTeachers: number;
  feesCollected: number;
  feesOutstanding: number;
  attendanceRate: number;
  totalMarked: number;
  genderData: { name: string; value: number }[];
  topStudents: { name: string; score: number }[];
}

export function AdminDashboard({
  userName,
  academicYear,
  term,
  totalStudents,
  totalTeachers,
  feesCollected,
  feesOutstanding,
  attendanceRate,
  totalMarked,
  genderData,
  topStudents,
}: AdminDashboardProps) {
  const totalFees = feesCollected + feesOutstanding;
  const collectionRate = totalFees > 0 ? Math.round((feesCollected / totalFees) * 100) : 0;

  const stats = [
    {
      label: "Total Students",
      value: totalStudents.toLocaleString(),
      sub: "Active enrolments",
      icon: Users,
      iconBg: "bg-indigo-500",
      trend: null,
      accent: "border-l-indigo-500",
    },
    {
      label: "Fees Collected",
      value: `GH₵ ${feesCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `${collectionRate}% collection rate`,
      icon: TrendingUp,
      iconBg: "bg-emerald-500",
      trend: collectionRate,
      accent: "border-l-emerald-500",
    },
    {
      label: "Active Teachers",
      value: totalTeachers.toString(),
      sub: "Staff on record",
      icon: GraduationCap,
      iconBg: "bg-violet-500",
      trend: null,
      accent: "border-l-violet-500",
    },
    {
      label: "Attendance Today",
      value: `${attendanceRate}%`,
      sub: `${totalMarked} students marked`,
      icon: CalendarCheck,
      iconBg: attendanceRate >= 80 ? "bg-emerald-500" : "bg-amber-500",
      trend: attendanceRate,
      accent: attendanceRate >= 80 ? "border-l-emerald-500" : "border-l-amber-500",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Good morning 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening at your school today.</p>
        </div>

        <form className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm">
          <select name="academic_year" defaultValue={academicYear}
            className="h-8 border-0 bg-transparent px-2 text-sm focus:outline-none text-foreground">
            <option value="">All Years</option>
            <option value="2023/2024">2023/2024</option>
            <option value="2024/2025">2024/2025</option>
            <option value="2025/2026">2025/2026</option>
          </select>
          <div className="w-px h-5 bg-border" />
          <select name="term" defaultValue={term}
            className="h-8 border-0 bg-transparent px-2 text-sm focus:outline-none text-foreground">
            <option value="">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
          <button type="submit"
            className="h-8 px-3 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary/90 transition-colors">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className={`relative bg-card rounded-xl border border-l-4 ${stat.accent} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg} shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {stat.trend !== null && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="h-3 w-3" />{stat.trend}%
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {feesOutstanding > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 shrink-0">
            <TrendingUp className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              GH₵ {feesOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })} outstanding fees
            </p>
            <p className="text-xs text-amber-700">{100 - collectionRate}% of invoiced amount not yet collected.</p>
          </div>
        </div>
      )}

      <DashboardCharts genderData={genderData} topStudents={topStudents} />
    </div>
  );
}
