"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Trophy } from "lucide-react";

interface DashboardChartsProps {
  genderData: { name: string; value: number }[];
  topStudents: { name: string; score: number }[];
}

const PIE_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b"];

const RANK_STYLES = [
  { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200", label: "1st" },
  { bg: "bg-slate-50",  text: "text-slate-500",  ring: "ring-slate-200",  label: "2nd" },
  { bg: "bg-orange-50", text: "text-orange-500", ring: "ring-orange-200", label: "3rd" },
];

export function DashboardCharts({ genderData, topStudents }: DashboardChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Top Performing Students */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Top Performing Students</CardTitle>
              <CardDescription className="text-xs mt-0.5">Ranked by average exam score</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          {topStudents.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No exam results recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topStudents.map((s, i) => {
                const style = RANK_STYLES[i] ?? { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", label: `${i + 1}th` };
                const barWidth = Math.max(10, s.score);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${style.bg} ${style.text} ${style.ring}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                        <span className="text-xs font-bold text-primary ml-2 shrink-0">{s.score}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-base">Gender Distribution</CardTitle>
              <CardDescription className="text-xs mt-0.5">Active enrolments by gender</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[260px] flex justify-center items-center pt-4">
          {genderData.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">No student data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {genderData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} students`, name]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ fontSize: "12px", color: "var(--foreground)" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
