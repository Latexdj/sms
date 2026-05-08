"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, UserCheck, AlertOctagon, RotateCcw, ScanLine, Search, LayoutGrid, PlusCircle, Loader2 } from "lucide-react";

type Book = { id: string; isbn: string | null; title: string; author: string; category: string | null; copies_total: number; copies_available: number };
type Loan = {
  id: string;
  due_date: string;
  status: string;
  book: { id: string; title: string; isbn: string | null };
  student: { id: string; first_name: string; last_name: string; admission_number: string };
};

export default function LibraryDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("desk");

  const [checkoutForm, setCheckoutForm] = useState({ admission_number: "", isbn: "", loan_days: "14" });
  const [addBookForm, setAddBookForm] = useState({ title: "", author: "", isbn: "", category: "", copies_total: "1" });

  useEffect(() => {
    fetchBooks();
    fetchLoans();
    fetchOverdue();
  }, []);

  const fetchBooks = async (q?: string) => {
    try {
      const res = await fetch(`/api/library${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (res.ok) setBooks(await res.json());
    } catch { toast.error("Failed to load books"); }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/library?type=loans");
      if (res.ok) setLoans(await res.json());
    } catch {}
  };

  const fetchOverdue = async () => {
    try {
      const res = await fetch("/api/library?type=overdue");
      if (res.ok) setOverdueLoans(await res.json());
    } catch {}
  };

  const handleCheckout = async () => {
    if (!checkoutForm.admission_number || !checkoutForm.isbn) {
      return toast.error("Admission number and ISBN are required.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", ...checkoutForm }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`'${data.book?.title}' checked out successfully. Due: ${new Date(data.due_date).toLocaleDateString()}`);
        setCheckoutForm({ admission_number: "", isbn: "", loan_days: "14" });
        fetchBooks();
        fetchLoans();
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/library", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loanId }),
      });
      if (res.ok) {
        toast.success("Book returned successfully.");
        fetchBooks();
        fetchLoans();
        fetchOverdue();
      } else {
        const err = await res.json();
        toast.error(err.error || "Return failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!addBookForm.title || !addBookForm.author) return toast.error("Title and author are required.");
    setLoading(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_book", ...addBookForm }),
      });
      if (res.ok) {
        toast.success("Book added to catalog.");
        setAddBookForm({ title: "", author: "", isbn: "", category: "", copies_total: "1" });
        fetchBooks();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add book");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (b.isbn || "").includes(searchQ) ||
    b.author.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BookOpen className="h-6 w-6" /> Library Management</h2>
          <p className="text-muted-foreground">Manage book checkouts, returns, and the library catalog.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="desk" className="flex items-center gap-2">
            <ScanLine className="h-4 w-4" /> Operations Desk
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-500" /> Overdue ({overdueLoans.length})
          </TabsTrigger>
        </TabsList>

        {/* Operations Desk */}
        <TabsContent value="desk" className="grid gap-6 md:grid-cols-[1.5fr_2fr]">
          <div className="space-y-4">
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScanLine className="h-4 w-4" /> Book Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Student Admission Number</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9 font-mono uppercase" placeholder="e.g. SHS-12-888"
                      value={checkoutForm.admission_number}
                      onChange={e => setCheckoutForm({ ...checkoutForm, admission_number: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label>Book ISBN</Label>
                    <Input className="font-mono" placeholder="Scan or type ISBN..."
                      value={checkoutForm.isbn}
                      onChange={e => setCheckoutForm({ ...checkoutForm, isbn: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Loan Days</Label>
                    <Input type="number" placeholder="14" value={checkoutForm.loan_days}
                      onChange={e => setCheckoutForm({ ...checkoutForm, loan_days: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full font-bold" size="lg" onClick={handleCheckout} disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Checkout Book"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Book</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={addBookForm.title} onChange={e => setAddBookForm({ ...addBookForm, title: e.target.value })} />
                <Input placeholder="Author" value={addBookForm.author} onChange={e => setAddBookForm({ ...addBookForm, author: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="ISBN (optional)" value={addBookForm.isbn} onChange={e => setAddBookForm({ ...addBookForm, isbn: e.target.value })} />
                  <Input placeholder="Category" value={addBookForm.category} onChange={e => setAddBookForm({ ...addBookForm, category: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Copies" className="w-[80px]" value={addBookForm.copies_total}
                    onChange={e => setAddBookForm({ ...addBookForm, copies_total: e.target.value })} />
                  <Button className="flex-1" onClick={handleAddBook} disabled={loading}>Add to Catalog</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Loans */}
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4 mb-2">
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>Currently borrowed books.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              {loans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active loans.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3 text-center">Due</th>
                      <th className="px-2 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(ln => (
                      <tr key={ln.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-primary text-xs">{ln.book.title}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {ln.student.first_name} {ln.student.last_name}
                          <br /><span className="font-mono">{ln.student.admission_number}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ln.status === "OVERDUE" ? "destructive" : "default"} className="shadow-none text-xs">
                            {new Date(ln.due_date).toLocaleDateString()}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleReturn(ln.id)} disabled={loading}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 h-8">
                            <RotateCcw className="h-4 w-4 mr-1" /> Return
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
              <div>
                <CardTitle>Book Catalog</CardTitle>
                <CardDescription>{books.length} book titles on record.</CardDescription>
              </div>
              <div className="relative w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search title, author, or ISBN..." className="pl-9 h-9" value={searchQ}
                  onChange={e => {
                    setSearchQ(e.target.value);
                    if (!e.target.value) fetchBooks();
                  }}
                  onKeyDown={e => e.key === "Enter" && fetchBooks(searchQ)} />
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map(bk => (
                <div key={bk.id} className="border rounded-md p-4 bg-muted/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-primary leading-tight">{bk.title}</h3>
                      {bk.copies_available === 0 ? (
                        <Badge variant="destructive" className="shrink-0 ml-2 shadow-none">OUT</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 shrink-0 ml-2 shadow-none">IN STOCK</Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold">{bk.author}</p>
                    {bk.isbn && <p className="text-xs text-muted-foreground font-mono mt-1">{bk.isbn}</p>}
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
                    <span className="bg-muted px-2 py-1 rounded text-muted-foreground font-semibold uppercase">
                      {bk.category || "General"}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      <span className="text-foreground font-bold text-sm">{bk.copies_available}</span> / {bk.copies_total}
                    </span>
                  </div>
                </div>
              ))}
              {filteredBooks.length === 0 && (
                <div className="col-span-3 text-center text-muted-foreground py-8">No books found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue">
          <Card className="border-rose-200 shadow-sm">
            <CardHeader className="bg-rose-50/50">
              <CardTitle className="text-rose-700 flex items-center gap-2"><AlertOctagon className="h-5 w-5" /> Overdue Returns</CardTitle>
              <CardDescription>Books that have passed their due date and not yet returned.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {overdueLoans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No overdue books. All clear!</p>
              ) : (
                overdueLoans.map(ln => (
                  <div key={ln.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 border rounded border-rose-200 bg-rose-50/30 mb-2">
                    <div>
                      <span className="font-bold text-rose-900">{ln.book.title}</span>
                      <p className="text-sm text-rose-800/70 py-1">Due: {new Date(ln.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 md:mt-0">
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                        <p className="font-mono font-bold text-sm">
                          {ln.student.first_name} {ln.student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{ln.student.admission_number}</p>
                      </div>
                      <Button size="sm" onClick={() => handleReturn(ln.id)} disabled={loading}
                        className="text-emerald-600 hover:text-emerald-700 bg-white border hover:bg-emerald-50">
                        <RotateCcw className="h-4 w-4 mr-1" /> Mark Returned
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
