"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Layers, FileText, Banknote, AlertCircle, PlusCircle, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Invoice = {
  id: string;
  academic_year: string;
  term: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  student: { id: string; first_name: string; last_name: string; admission_number: string };
};

type FeeStructure = {
  id: string;
  name: string;
  amount: number;
  fee_type: string;
  academic_year: string;
  class: { id: string; name: string };
};

type Class = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  PARTIAL: "bg-amber-100 text-amber-800",
  PENDING: "bg-blue-100 text-blue-800",
  OVERDUE: "bg-destructive/20 text-destructive",
};

export default function FeesDashboard() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Payment form
  const [payForm, setPayForm] = useState({ admission_number: "", amount: "", method: "CASH" });
  const [payLoading, setPayLoading] = useState(false);

  // Bulk generate form
  const [genForm, setGenForm] = useState({ class_id: "", academic_year: "2024/2025", term: "Term 1" });
  const [genLoading, setGenLoading] = useState(false);

  // Add structure form
  const [structForm, setStructForm] = useState({ class_id: "", academic_year: "2024/2025", name: "", amount: "", fee_type: "TUITION" });
  const [structLoading, setStructLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchStructures();
    fetch("/api/classes").then(r => r.json()).then(data => setClasses(Array.isArray(data) ? data : []));
  }, []);

  const fetchInvoices = async (q?: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/fees?${params}`);
      if (res.ok) setInvoices(await res.json());
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchStructures = async () => {
    try {
      const res = await fetch("/api/fees?type=structures");
      if (res.ok) setStructures(await res.json());
    } catch {}
  };

  const handleSearch = () => fetchInvoices(searchQ, statusFilter);

  const handleRecordPayment = async () => {
    if (!payForm.admission_number || !payForm.amount) return toast.error("Fill in student ID and amount.");
    setPayLoading(true);
    try {
      const res = await fetch("/api/fees/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Payment recorded. New balance: GHS ${Number(data.new_balance).toFixed(2)}`);
        setPayForm({ admission_number: "", amount: "", method: "CASH" });
        fetchInvoices();
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setPayLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!genForm.class_id || !genForm.academic_year || !genForm.term) return toast.error("Select class, year, and term.");
    setGenLoading(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated ${data.created} invoice(s) for ${data.total_students} student(s).`);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to generate invoices");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setGenLoading(false);
    }
  };

  const handleAddStructure = async () => {
    if (!structForm.class_id || !structForm.name || !structForm.amount) return toast.error("Fill in all fields.");
    setStructLoading(true);
    try {
      const res = await fetch("/api/fees/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(structForm),
      });
      if (res.ok) {
        toast.success("Fee structure created.");
        setStructForm({ class_id: "", academic_year: "2024/2025", name: "", amount: "", fee_type: "TUITION" });
        fetchStructures();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create structure");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setStructLoading(false);
    }
  };

  const overdue = invoices.filter(i => i.status === "OVERDUE" || i.status === "PARTIAL");
  const overdueTotal = overdue.reduce((s, i) => s + Number(i.balance), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fees & Payments</h2>
        <p className="text-muted-foreground">Manage fee structures, generate invoices, and record payments.</p>
      </div>

      <Tabs defaultValue="invoicing" className="space-y-4">
        <TabsList className="bg-muted w-full sm:w-auto h-auto flex flex-wrap gap-2 p-1">
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="structures" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Fee Structures
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" /> Record Payment
          </TabsTrigger>
          <TabsTrigger value="arrears" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Defaulters
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoicing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice Register</CardTitle>
                <CardDescription>All student fee invoices. Use filters to narrow down.</CardDescription>
              </div>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student..." className="pl-9 w-[180px]" value={searchQ}
                    onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
                </div>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <Button variant="outline" onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Filter"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {invoices.length === 0 ? (
                <div className="rounded-md border p-12 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-4 opacity-50" />
                  {loading ? "Loading..." : "No invoices found. Generate bulk invoices below."}
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-primary">
                          {inv.student.first_name} {inv.student.last_name}
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{inv.student.admission_number}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">{inv.term} {inv.academic_year}</td>
                        <td className="px-4 py-3 text-right font-mono">{Number(inv.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{Number(inv.amount_paid).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{Number(inv.balance).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${STATUS_COLORS[inv.status] || ""} shadow-none text-xs`}>{inv.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Bulk Generate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk Generate Invoices</CardTitle>
              <CardDescription>Generate invoices for all active students in a class based on their fee structures.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm w-[160px]"
                  value={genForm.class_id} onChange={e => setGenForm({ ...genForm, class_id: e.target.value })}>
                  <option value="">Select class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={genForm.academic_year} onChange={e => setGenForm({ ...genForm, academic_year: e.target.value })} className="w-[110px]" />
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={genForm.term} onChange={e => setGenForm({ ...genForm, term: e.target.value })}>
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
              </div>
              <Button onClick={handleBulkGenerate} disabled={genLoading}>
                {genLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : "Generate Invoices"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Structures Tab */}
        <TabsContent value="structures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>Define tuition, PTA, boarding, and other fees per class.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {structures.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No fee structures defined yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3 text-right">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structures.map(s => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold">{s.name}</td>
                        <td className="px-4 py-3">{s.class.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{s.fee_type}</Badge></td>
                        <td className="px-4 py-3 text-xs font-mono">{s.academic_year}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono">{Number(s.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Fee Structure</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm w-[150px]"
                  value={structForm.class_id} onChange={e => setStructForm({ ...structForm, class_id: e.target.value })}>
                  <option value="">Select class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Tuition Fee" value={structForm.name}
                  onChange={e => setStructForm({ ...structForm, name: e.target.value })} className="w-[160px]" />
              </div>
              <div className="space-y-2">
                <Label>Amount (GHS)</Label>
                <Input type="number" placeholder="0.00" value={structForm.amount}
                  onChange={e => setStructForm({ ...structForm, amount: e.target.value })} className="w-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={structForm.fee_type} onChange={e => setStructForm({ ...structForm, fee_type: e.target.value })}>
                  <option value="TUITION">Tuition</option>
                  <option value="PTA">PTA</option>
                  <option value="BOARDING">Boarding</option>
                  <option value="EXAM">Exam</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={structForm.academic_year} onChange={e => setStructForm({ ...structForm, academic_year: e.target.value })} className="w-[110px]" />
              </div>
              <Button onClick={handleAddStructure} disabled={structLoading}>
                {structLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Structure"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Record Payment Tab */}
        <TabsContent value="receive">
          <Card className="max-w-xl mx-auto mt-4 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Record Payment</CardTitle>
              <CardDescription>Process cash or bank payments and apply to the student's oldest outstanding invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Student Admission Number</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="e.g. SCH-2024-001" className="pl-9"
                    value={payForm.admission_number} onChange={e => setPayForm({ ...payForm, admission_number: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount Paid (GHS)</Label>
                <Input placeholder="0.00" type="number"
                  value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="MOMO">Mobile Money</option>
                  <option value="BANK">Bank Deposit</option>
                </select>
              </div>
              <Button className="w-full text-md font-semibold" size="lg" onClick={handleRecordPayment} disabled={payLoading}>
                {payLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Log Payment"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaulters Tab */}
        <TabsContent value="arrears">
          <Card>
            <CardHeader>
              <CardTitle>Arrears & Defaulters</CardTitle>
              <CardDescription>Students with unpaid or overdue fee balances.</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueTotal > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 flex justify-between items-center text-sm font-medium mb-4">
                  Total Outstanding: GHS {overdueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <Badge variant="destructive">{overdue.length} accounts</Badge>
                </div>
              )}
              {overdue.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No defaulters found.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3 text-right">Balance (GHS)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map(inv => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-primary">
                          {inv.student.first_name} {inv.student.last_name}
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{inv.student.admission_number}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">{inv.term} {inv.academic_year}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-destructive">{Number(inv.balance).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="destructive" className="shadow-none text-xs">{inv.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
