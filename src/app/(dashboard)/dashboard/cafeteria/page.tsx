"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Utensils, ShoppingCart, Search, CreditCard, Banknote, Loader2 } from "lucide-react";

type MenuItem = { id: string; name: string; unit_price: number; stock_quantity: number };
type WalletInfo = {
  student: { id: string; name: string; admission_number: string };
  wallet: { balance: number };
};
type CartItem = { item: MenuItem; qty: number };

export default function CafeteriaDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pos");

  const [studentSearch, setStudentSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetch("/api/cafeteria")
      .then(r => r.json())
      .then(data => setMenuItems(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load menu"));
  }, []);

  const cartTotal = cart.reduce((acc, c) => acc + (Number(c.item.unit_price) * c.qty), 0);

  const handleSearchWallet = async () => {
    if (!studentSearch.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/cafeteria?type=wallet&admission_number=${encodeURIComponent(studentSearch)}`);
      if (res.ok) {
        setWalletInfo(await res.json());
        toast.success("Wallet found.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Student not found");
        setWalletInfo(null);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSearchLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock_quantity === 0) return toast.error("Out of stock!");
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => setCart(cart.filter(c => c.item.id !== itemId));

  const handleCheckout = async (method: "CASH" | "WALLET") => {
    if (cart.length === 0) return toast.error("Cart is empty.");
    if (method === "WALLET") {
      if (!walletInfo) return toast.error("Select a student wallet first.");
      if (Number(walletInfo.wallet.balance) < cartTotal) return toast.error("Insufficient wallet balance.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cafeteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout",
          student_id: walletInfo?.student.id,
          cart_items: cart.map(c => ({ id: c.item.id, name: c.item.name, price: c.item.unit_price, qty: c.qty })),
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Transaction of GHS ${cartTotal.toFixed(2)} processed via ${method}.`);
        setCart([]);
        // Update wallet balance locally
        if (method === "WALLET" && walletInfo) {
          setWalletInfo({
            ...walletInfo,
            wallet: { balance: Number(walletInfo.wallet.balance) - cartTotal },
          });
        }
        // Refresh menu to update stock
        const mRes = await fetch("/api/cafeteria");
        if (mRes.ok) setMenuItems(await mRes.json());
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!walletInfo) return;
    const amountStr = prompt("Enter top-up amount (GHS):");
    if (!amountStr || isNaN(Number(amountStr))) return;
    const amount = Number(amountStr);
    if (amount <= 0) return;

    try {
      const res = await fetch("/api/cafeteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "topup", student_id: walletInfo.student.id, amount }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWalletInfo({ ...walletInfo, wallet: { balance: Number(updated.balance) } });
        toast.success(`Wallet topped up with GHS ${amount.toFixed(2)}`);
      } else {
        toast.error("Top-up failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Utensils className="h-6 w-6" /> Cafeteria POS</h2>
          <p className="text-muted-foreground">Process cafeteria sales and manage student wallet top-ups.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Point of Sale
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" /> Menu Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {/* Wallet Search */}
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Student Wallet</span>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Admission number..." className="w-[180px] h-8 text-sm bg-background"
                      value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearchWallet()} />
                    <Button size="sm" className="h-8" onClick={handleSearchWallet} disabled={searchLoading}>
                      {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletInfo ? (
                  <div className="flex justify-between items-center bg-background border p-3 rounded-lg border-emerald-200">
                    <div>
                      <span className="text-emerald-800 font-bold">{walletInfo.student.name}</span>
                      <p className="text-xs text-muted-foreground font-mono">{walletInfo.student.admission_number}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Balance</p>
                        <p className="text-2xl font-bold font-mono text-primary">GHS {Number(walletInfo.wallet.balance).toFixed(2)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleTopup} className="text-xs">Top Up</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-4 py-2 border border-dashed rounded text-sm text-muted-foreground italic h-[60px]">
                    Search a student by admission number to load their wallet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {menuItems.map(item => (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${item.stock_quantity === 0 ? "opacity-50 grayscale" : "border-primary/20 hover:border-primary/50"}`}
                  onClick={() => addToCart(item)}
                >
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm line-clamp-1">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 flex justify-between items-end">
                    <span className="font-bold text-primary">GHS {Number(item.unit_price).toFixed(2)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.stock_quantity === 0 ? "Out of stock" : `Qty: ${item.stock_quantity}`}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {menuItems.length === 0 && (
                <div className="col-span-3 text-center text-muted-foreground py-8">
                  No menu items. Add items in Menu Management.
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <Card className="h-fit sticky top-4 flex flex-col shadow-lg border-primary/30">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-lg flex justify-between items-center">
                Cart <Badge variant="secondary">{cart.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-[250px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-muted-foreground p-8 opacity-60">
                  <ShoppingCart className="h-10 w-10 mb-2" />
                  <span className="text-sm text-center">Cart is empty. Click items to add.</span>
                </div>
              ) : (
                <div className="divide-y max-h-[350px] overflow-auto">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 text-sm hover:bg-muted/30">
                      <div className="flex flex-col max-w-[150px]">
                        <span className="font-semibold truncate">{c.item.name}</span>
                        <span className="text-xs text-muted-foreground">x{c.qty} @ GHS {Number(c.item.unit_price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">GHS {(c.qty * Number(c.item.unit_price)).toFixed(2)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive"
                          onClick={() => removeFromCart(c.item.id)}>×</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col bg-muted/40 border-t p-4 pb-6">
              <div className="w-full flex justify-between items-center mb-4 pt-2">
                <span className="font-bold tracking-widest uppercase text-muted-foreground text-xs">Total</span>
                <span className="text-3xl font-bold font-mono text-primary">GHS {cartTotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button size="lg" disabled={loading || cart.length === 0} onClick={() => handleCheckout("WALLET")}
                  className="font-bold flex gap-2">
                  <CreditCard className="h-4 w-4" /> Wallet
                </Button>
                <Button size="lg" disabled={loading || cart.length === 0} onClick={() => handleCheckout("CASH")}
                  variant="outline" className="font-bold flex gap-2 border-primary text-primary hover:bg-primary/10">
                  <Banknote className="h-4 w-4" /> Cash
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <AddMenuItemCard onAdd={(item) => setMenuItems(prev => [...prev, item])} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddMenuItemCard({ onAdd }: { onAdd: (item: MenuItem) => void }) {
  const [form, setForm] = useState({ name: "", unit_price: "", stock_quantity: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.name || !form.unit_price) return toast.error("Name and price required.");
    setLoading(true);
    try {
      const res = await fetch("/api/cafeteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_item", ...form }),
      });
      if (res.ok) {
        const item = await res.json();
        onAdd(item);
        setForm({ name: "", unit_price: "", stock_quantity: "" });
        toast.success("Menu item added.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add item");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Add Menu Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Item Name</Label>
          <Input placeholder="e.g. Jollof Rice & Chicken" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Price (GHS)</Label>
            <Input type="number" placeholder="0.00" value={form.unit_price}
              onChange={e => setForm({ ...form, unit_price: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Initial Stock</Label>
            <Input type="number" placeholder="0" value={form.stock_quantity}
              onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
          </div>
        </div>
        <Button className="w-full" onClick={handleAdd} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Add to Menu
        </Button>
      </CardContent>
    </Card>
  );
}
