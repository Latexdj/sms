"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserCheck, ShieldAlert, Activity, Banknote, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Teacher = {
  id: string;
  user_id: string;
  staff_id: string;
  qualification: string | null;
  subject_specialty: string | null;
  salary_amount: number;
  phone: string | null;
  status: string;
  user: { id: string; name: string; email: string; is_active: boolean };
};

type Performance = {
  metrics: {
    extrapolated_days_present: number;
    grading_completion_percentage: number;
    total_assignments_issued: number;
  };
};

const EMPTY_FORM = {
  name: "", email: "", password: "",
  staff_id: "", qualification: "", subject_specialty: "",
  salary_amount: "", phone: "", address: "",
  bank_name: "", bank_account: "", ssnit_number: "",
};

export default function HumanResourcesDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProfile, setActiveProfile] = useState<Teacher | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async (q?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (res.ok) setTeachers(await res.json());
      else toast.error("Failed to load teachers");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher: Teacher) => {
    setActiveProfile(teacher);
    setPerfLoading(true);
    setPerformance(null);
    try {
      const res = await fetch(`/api/teachers/performance?teacher_id=${teacher.user_id}`);
      if (res.ok) setPerformance(await res.json());
    } catch {}
    finally { setPerfLoading(false); }
  };

  const handleAddStaff = async () => {
    if (!form.name || !form.email || !form.password || !form.staff_id || !form.salary_amount) {
      return toast.error("Name, email, password, staff ID, and salary are required.");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${form.name} added to staff directory.`);
        setForm(EMPTY_FORM);
        setDialogOpen(false);
        fetchTeachers();
      } else {
        toast.error(data.error || "Failed to add staff member");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.staff_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff & Human Resources</h2>
        <p className="text-muted-foreground">Manage teacher profiles, payroll and performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        <Card className="flex flex-col border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-2">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>Click a row to view the staff profile.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or staff ID..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchTeachers(searchTerm)}
                />
              </div>

              {/* Add Staff Dialog */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={<Button size="sm" className="gap-1.5" />}
                >
                  <UserPlus className="h-4 w-4" /> Add Staff
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg" showCloseButton>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label>Full Name <span className="text-destructive">*</span></Label>
                        <Input placeholder="e.g. Kwame Mensah" value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email <span className="text-destructive">*</span></Label>
                        <Input type="email" placeholder="staff@school.edu" value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Password <span className="text-destructive">*</span></Label>
                        <Input type="password" placeholder="Initial password" value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Staff ID <span className="text-destructive">*</span></Label>
                        <Input placeholder="e.g. TCH-001" value={form.staff_id}
                          onChange={e => setForm({ ...form, staff_id: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Monthly Salary (GHS) <span className="text-destructive">*</span></Label>
                        <Input type="number" placeholder="0.00" value={form.salary_amount}
                          onChange={e => setForm({ ...form, salary_amount: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Qualification</Label>
                        <Input placeholder="e.g. B.Ed Mathematics" value={form.qualification}
                          onChange={e => setForm({ ...form, qualification: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Subject Specialty</Label>
                        <Input placeholder="e.g. Mathematics" value={form.subject_specialty}
                          onChange={e => setForm({ ...form, subject_specialty: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input placeholder="0244XXXXXX" value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Address</Label>
                        <Input placeholder="Residential address" value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bank Name</Label>
                        <Input placeholder="e.g. GCB Bank" value={form.bank_name}
                          onChange={e => setForm({ ...form, bank_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bank Account No.</Label>
                        <Input placeholder="Account number" value={form.bank_account}
                          onChange={e => setForm({ ...form, bank_account: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>SSNIT Number</Label>
                        <Input placeholder="SSNIT number" value={form.ssnit_number}
                          onChange={e => setForm({ ...form, ssnit_number: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter showCloseButton>
                    <Button onClick={handleAddStaff} disabled={saving} className="font-bold">
                      {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Add Staff Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 uppercase mb-2 text-xs border-b">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Staff ID</th>
                    <th className="px-4 py-3">Specialty</th>
                    <th className="px-2 py-3 text-center">Status</th>
                    <th className="px-2 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(teacher => (
                    <tr
                      key={teacher.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => handleSelectTeacher(teacher)}
                    >
                      <td className="px-4 py-3 font-semibold text-primary">{teacher.user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{teacher.staff_id}</td>
                      <td className="px-4 py-3">{teacher.subject_specialty || "—"}</td>
                      <td className="px-2 py-3 text-center">
                        <Badge variant={teacher.status === "ACTIVE" ? "default" : teacher.status === "ON_LEAVE" ? "outline" : "destructive"}>
                          {teacher.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTeachers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        No staff found. Click "Add Staff" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Profile Panel */}
        <Card className="h-fit">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-primary flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> Staff Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {activeProfile ? (
              <>
                <div className="flex flex-col items-center border-b pb-4">
                  <div className="h-20 w-20 bg-primary/20 text-primary font-bold text-3xl flex items-center justify-center rounded-full mb-3">
                    {activeProfile.user.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-xl">{activeProfile.user.name}</h3>
                  <p className="text-muted-foreground text-sm font-mono tracking-wider">{activeProfile.staff_id}</p>
                  <p className="text-xs text-muted-foreground">{activeProfile.user.email}</p>
                  {activeProfile.phone && <p className="text-xs text-muted-foreground">{activeProfile.phone}</p>}
                  <Badge className="mt-2 text-xs" variant={activeProfile.status === "ACTIVE" ? "default" : "outline"}>
                    {activeProfile.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide flex items-center gap-2">
                    <Banknote className="h-4 w-4" /> Payroll
                  </h4>
                  <div className="grid grid-cols-2 text-sm bg-muted/20 p-3 rounded border border-dashed gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Monthly Salary</p>
                      <p className="font-bold font-mono">GHS {Number(activeProfile.salary_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Qualification</p>
                      <p className="font-bold text-xs">{activeProfile.qualification || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Specialty</p>
                      <p className="font-bold text-xs">{activeProfile.subject_specialty || "—"}</p>
                    </div>
                  </div>
                </div>

                {perfLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : performance ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Performance
                    </h4>
                    <div className="bg-emerald-50 text-emerald-900 p-3 rounded border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Days of Attendance</span>
                        <span className="font-bold text-lg">{performance.metrics.extrapolated_days_present}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 text-blue-900 p-3 rounded border border-blue-200 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Grading Completion</span>
                        <span className="font-bold text-lg">{performance.metrics.grading_completion_percentage}%</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="min-h-[250px] flex flex-col justify-center items-center text-center opacity-70">
                <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm">Select a staff member to view their profile.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
