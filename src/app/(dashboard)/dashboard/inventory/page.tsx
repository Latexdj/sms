"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Search, Box, Trash2, BarChart3, Edit, PlusCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Asset = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  location: string | null;
  purchase_cost: number;
};

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "#10b981",
  FAIR: "#f59e0b",
  DAMAGED: "#ef4444",
  DISPOSED: "#6b7280",
};

export default function FacilityInventoryDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("registry");

  const [searchFilter, setSearchFilter] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [condFilter, setCondFilter] = useState("ALL");

  const [addForm, setAddForm] = useState({
    name: "", category: "ELECTRONICS", quantity: "1", condition: "GOOD",
    location: "", purchase_date: "", purchase_cost: "", notes: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [catFilter, condFilter]);

  const fetchAssets = async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (catFilter !== "ALL") params.set("category", catFilter);
      if (condFilter !== "ALL") params.set("condition", condFilter);
      const res = await fetch(`/api/inventory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotalValue(data.totalValue || 0);
      }
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleDispose = async (id: string, name: string) => {
    if (!confirm(`Mark "${name}" as DISPOSED?`)) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, condition: "DISPOSED" }),
      });
      if (res.ok) {
        toast.success(`"${name}" marked as disposed.`);
        fetchAssets(searchFilter);
      } else {
        toast.error("Failed to update asset");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleAddAsset = async () => {
    if (!addForm.name || !addForm.category) return toast.error("Name and category are required.");
    setAddLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast.success("Asset added successfully.");
        setAddForm({ name: "", category: "ELECTRONICS", quantity: "1", condition: "GOOD", location: "", purchase_date: "", purchase_cost: "", notes: "" });
        fetchAssets(searchFilter);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add asset");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAddLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchQ = !searchFilter || a.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (a.location || "").toLowerCase().includes(searchFilter.toLowerCase());
    return matchQ;
  });

  const conditionAggregates = ["GOOD", "FAIR", "DAMAGED", "DISPOSED"].map(cond => ({
    name: cond,
    count: assets.filter(a => a.condition === cond).reduce((s, a) => s + a.quantity, 0),
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-6 w-6" /> Facility & Asset Registry</h2>
          <p className="text-muted-foreground">Track school assets, equipment, and their conditions.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="registry" className="flex items-center gap-2">
            <Box className="h-4 w-4" /> Asset Registry
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add Asset
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Valuation Summary
          </TabsTrigger>
        </TabsList>

        {/* Registry Tab */}
        <TabsContent value="registry" className="space-y-4">
          <Card className="shadow-sm bg-muted/20 border-primary/10">
            <CardContent className="p-4 grid md:grid-cols-[2fr_1fr_1fr] gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or location..." className="pl-9 h-10" value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchAssets(searchFilter)} />
              </div>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="ALL">All Categories</option>
                <option value="FURNITURE">Furniture</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="TEXTBOOKS">Textbooks</option>
                <option value="SPORTS">Sports</option>
                <option value="OTHER">Other</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={condFilter} onChange={e => setCondFilter(e.target.value)}>
                <option value="ALL">All Conditions</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="DAMAGED">Damaged</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-auto">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 uppercase text-xs border-b">
                    <tr>
                      <th className="px-5 py-4">Asset</th>
                      <th className="px-5 py-4">Quantity</th>
                      <th className="px-5 py-4">Condition</th>
                      <th className="px-5 py-4 text-right">Unit Cost (GHS)</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-primary block leading-tight">{asset.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] tracking-widest">{asset.category}</Badge>
                            {asset.location && (
                              <span className="text-[11px] text-muted-foreground truncate opacity-75">{asset.location}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-lg">{asset.quantity}</td>
                        <td className="px-5 py-4">
                          <Badge
                            style={{ color: CONDITION_COLORS[asset.condition], backgroundColor: `${CONDITION_COLORS[asset.condition]}20`, borderColor: CONDITION_COLORS[asset.condition] }}
                            variant="outline" className="shadow-none tracking-widest uppercase">
                            {asset.condition}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold">
                          {Number(asset.purchase_cost).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                              onClick={() => handleDispose(asset.id, asset.name)}
                              disabled={asset.condition === "DISPOSED"}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAssets.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic opacity-60">
                          No assets found. Add assets using the "Add Asset" tab.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Asset Tab */}
        <TabsContent value="add">
          <Card className="max-w-xl shadow-sm">
            <CardHeader>
              <CardTitle>Register New Asset</CardTitle>
              <CardDescription>Add equipment, furniture, or other school assets to the registry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input placeholder="e.g. Dell Optiplex Desktop" value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}>
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="TEXTBOOKS">Textbooks</option>
                    <option value="SPORTS">Sports</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={addForm.condition} onChange={e => setAddForm({ ...addForm, condition: e.target.value })}>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" placeholder="1" value={addForm.quantity}
                    onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit Purchase Cost (GHS)</Label>
                  <Input type="number" placeholder="0.00" value={addForm.purchase_cost}
                    onChange={e => setAddForm({ ...addForm, purchase_cost: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location / Room</Label>
                <Input placeholder="e.g. ICT Lab A, Block C" value={addForm.location}
                  onChange={e => setAddForm({ ...addForm, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input type="date" value={addForm.purchase_date}
                  onChange={e => setAddForm({ ...addForm, purchase_date: e.target.value })} />
              </div>
              <Button className="w-full font-bold" size="lg" onClick={handleAddAsset} disabled={addLoading}>
                {addLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</> : "Register Asset"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <Card className="h-fit shadow-sm border-t-4 border-t-emerald-500">
            <CardHeader className="bg-emerald-50/30 pb-4">
              <CardDescription className="uppercase tracking-widest font-bold text-emerald-800 text-xs">Total Capital Value</CardDescription>
              <CardTitle className="text-4xl font-mono text-emerald-600 flex items-start pt-2">
                <span className="text-lg opacity-50 mr-1 mt-1">GHS</span>
                {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </CardTitle>
              <p className="text-xs text-muted-foreground italic pt-2">(Excludes disposed assets)</p>
            </CardHeader>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Asset Condition Breakdown</CardTitle>
              <CardDescription>Total units by physical condition.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {conditionAggregates.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">No asset data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionAggregates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: "bold", fill: "#6b7280" }} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} formatter={(value: any) => [`${Number(value).toLocaleString()} units`, "Items"]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {conditionAggregates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CONDITION_COLORS[entry.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
