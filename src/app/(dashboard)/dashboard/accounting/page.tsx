"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, TrendingUp, TrendingDown, BookOpenCheck, ArrowRightLeft, FileSpreadsheet, Loader2, PlusCircle } from "lucide-react";

type Account = { id: string; name: string; type: string; balance: number };
type LedgerTx = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  account: { id: string; name: string; type: string };
  recorder: { id: string; name: string };
};

export default function GeneralLedgerDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<LedgerTx[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [journalForm, setJournalForm] = useState({ accountId: "", type: "DEBIT", amount: "", desc: "" });
  const [newAccountForm, setNewAccountForm] = useState({ name: "", type: "INCOME" });

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounting?type=accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setSummary(data.summary || { income: 0, expense: 0, net: 0 });
      }
    } catch {
      toast.error("Failed to load accounts");
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/accounting?type=ledger");
      if (res.ok) setTransactions(await res.json());
    } catch {}
  };

  const handleJournalPost = async () => {
    if (!journalForm.accountId || !journalForm.amount) return toast.error("Account and amount are required.");
    setLoading(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: journalForm.accountId,
          transaction_type: journalForm.type,
          amount: journalForm.amount,
          description: journalForm.desc,
        }),
      });
      if (res.ok) {
        toast.success("Journal entry posted successfully.");
        setJournalForm({ accountId: "", type: "DEBIT", amount: "", desc: "" });
        fetchAccounts();
        fetchTransactions();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to post entry");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountForm.name) return toast.error("Account name is required.");
    setLoading(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_account", name: newAccountForm.name, type: newAccountForm.type }),
      });
      if (res.ok) {
        toast.success("Account created.");
        setNewAccountForm({ name: "", type: "INCOME" });
        fetchAccounts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create account");
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
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BookOpenCheck className="h-6 w-6" /> General Ledger</h2>
          <p className="text-muted-foreground">Double-entry accounting — track income, expenses, and generate P&L.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" /> P&L Summary
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Journal Entries
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Chart of Accounts
          </TabsTrigger>
        </TabsList>

        {/* P&L Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="border-t-4 border-t-emerald-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="uppercase tracking-widest font-bold text-xs">Total Income</CardDescription>
                <CardTitle className="text-3xl font-mono text-emerald-600">
                  GHS {summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-t-4 border-t-rose-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="uppercase tracking-widest font-bold text-xs">Total Expenses</CardDescription>
                <CardTitle className="text-3xl font-mono text-rose-600">
                  GHS {summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className={`border-t-4 shadow-sm ${summary.net >= 0 ? "border-t-primary" : "border-t-destructive"}`}>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase tracking-widest font-bold text-xs flex justify-between">
                  Net Profit / Loss
                  {summary.net >= 0
                    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                    : <TrendingDown className="h-4 w-4 text-destructive" />}
                </CardDescription>
                <CardTitle className="text-3xl font-mono">
                  GHS {summary.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet. Post a journal entry to get started.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">Type</th>
                      <th className="px-2 py-3 text-right">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-primary">{tx.account.name}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tx.description || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={tx.type === "CREDIT" ? "bg-emerald-100 text-emerald-800 shadow-none" : "bg-rose-100 text-rose-800 shadow-none"}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right font-bold font-mono">{Number(tx.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entry Tab */}
        <TabsContent value="journal" className="grid md:grid-cols-[2fr_1fr] gap-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Journal Ledger</CardTitle>
              <Badge variant="outline" className="text-primary">DOUBLE-ENTRY</Badge>
            </CardHeader>
            <CardContent className="overflow-auto pt-2">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No entries yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-center">Type</th>
                      <th className="px-2 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-primary">{tx.account.name}</span>
                          {tx.description && <><br /><span className="text-[10px] text-muted-foreground">{tx.description}</span></>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={tx.type === "CREDIT" ? "bg-emerald-100 text-emerald-800 shadow-none" : "bg-rose-100 text-rose-800 shadow-none"}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right font-bold font-mono">{Number(tx.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="bg-muted/40">
              <CardTitle className="text-lg">Post Journal Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Account</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={journalForm.accountId} onChange={e => setJournalForm({ ...journalForm, accountId: e.target.value })}>
                  <option value="">Select account...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold"
                    value={journalForm.type} onChange={e => setJournalForm({ ...journalForm, type: e.target.value })}>
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (GHS)</Label>
                  <Input type="number" placeholder="0.00" value={journalForm.amount}
                    onChange={e => setJournalForm({ ...journalForm, amount: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Memo / Description</Label>
                <Input placeholder="e.g. Monthly salary payment"
                  value={journalForm.desc} onChange={e => setJournalForm({ ...journalForm, desc: e.target.value })} />
              </div>
              <Button className="w-full font-bold mt-4" size="lg" onClick={handleJournalPost} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting...</> : "Post Entry"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart of Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["INCOME", "EXPENSE", "ASSET", "LIABILITY"].map(type => (
                <div key={type} className="border rounded-lg bg-muted/5 p-4 flex flex-col h-full">
                  <h3 className="font-bold tracking-widest text-xs uppercase mb-4 text-muted-foreground border-b pb-2">{type}</h3>
                  <div className="flex-1 space-y-2">
                    {accounts.filter(a => a.type === type).map(a => (
                      <div key={a.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/30 rounded">
                        <span className="font-semibold text-primary/80 line-clamp-1">{a.name}</span>
                        <span className="font-mono text-xs">{Number(a.balance).toLocaleString()}</span>
                      </div>
                    ))}
                    {accounts.filter(a => a.type === type).length === 0 && (
                      <div className="text-xs italic text-muted-foreground opacity-50 py-2">No accounts.</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input placeholder="e.g. Salaries Expense" value={newAccountForm.name}
                  onChange={e => setNewAccountForm({ ...newAccountForm, name: e.target.value })} className="w-[200px]" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newAccountForm.type} onChange={e => setNewAccountForm({ ...newAccountForm, type: e.target.value })}>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                </select>
              </div>
              <Button onClick={handleCreateAccount} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
