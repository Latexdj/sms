"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Download, Upload, UserPlus, ArrowRight, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY_FORM = {
  first_name: "", last_name: "", admission_number: "",
  gender: "MALE", dob: "", parent_phone: "",
};

export default function StudentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "";
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "HEADTEACHER"].includes(role);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      if (!res.ok) {
        throw new Error("Failed to fetch students");
      }
      const fetched = await res.json();
      if (Array.isArray(fetched)) {
        setData(fetched);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch {
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        toast.info(`Parsed ${results.data.length} records. Uploading...`);
        try {
          const res = await fetch("/api/students", {
            method: "POST",
            body: JSON.stringify(results.data),
            headers: { "Content-Type": "application/json" },
          });
          if (res.ok) {
            toast.success("Bulk import completed successfully.");
            fetchStudents();
          } else {
            const err = await res.json();
            toast.error(err.error || "Import failed.");
          }
        } catch {
          toast.error("Failed to import CSV.");
        }
      },
    });
  };

  const handleBulkPromote = async () => {
    if (selectedStudentIds.length === 0) {
      toast.warning("Please select at least one student.");
      return;
    }
    toast.info("Bulk promotion: select a target class in the dialog (coming soon).");
  };

  const handleAddStudent = async () => {
    if (!form.first_name || !form.last_name || !form.admission_number || !form.dob) {
      return toast.error("First name, last name, admission number, and DOB are required.");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success(`Student ${form.first_name} admitted successfully.`);
        setForm(EMPTY_FORM);
        setDialogOpen(false);
        fetchStudents();
      } else {
        toast.error(resData.error || "Failed to admit student");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Students Directory" : "My Students"}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin
              ? "Manage admissions, view profiles, and handle class promotions."
              : "Students in your assigned classes."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById("csv-upload")?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-semibold shadow-sm">
                    <UserPlus className="mr-2 h-4 w-4" /> New Admission
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Admission</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Admission Number</Label>
                      <Input value={form.admission_number} onChange={e => setForm({...form, admission_number: e.target.value})} placeholder="ADM-001" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={form.gender} 
                          onChange={e => setForm({...form, gender: e.target.value})}
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Phone</Label>
                      <Input value={form.parent_phone} onChange={e => setForm({...form, parent_phone: e.target.value})} placeholder="024XXXXXXX" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddStudent} disabled={saving} className="w-full">
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Admitting...</> : "Submit Admission"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              <Lock className="h-3.5 w-3.5" />
              View only — contact admin to add students
            </div>
          )}
        </div>
      </div>

      {isAdmin && selectedStudentIds.length > 0 && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg flex items-center justify-between flex-wrap gap-2">
          <span className="font-medium text-sm">{selectedStudentIds.length} students selected.</span>
          <Button size="sm" onClick={handleBulkPromote}>
            Promote to Next Class <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {loading ? (
        <div className="h-96 w-full flex items-center justify-center text-muted-foreground border rounded-xl bg-card">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading students...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowsSelected={isAdmin ? (ids) => setSelectedStudentIds(ids) : undefined}
        />
      )}
    </div>
  );
}
