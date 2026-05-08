"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Bus, UserPlus, Loader2, PlusCircle, Ticket, ShieldAlert } from "lucide-react";

type BusRoute = {
  id: string;
  name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  pickup_points: string[];
  _count: { enrollments: number };
};

type Enrollment = {
  id: string;
  term: string;
  amount: number;
  paid: boolean;
  student: { id: string; first_name: string; last_name: string; admission_number: string };
  route: { id: string; name: string };
};

export default function TransportDashboard() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("routes");

  const [routeForm, setRouteForm] = useState({ name: "", vehicle_number: "", driver_name: "", driver_phone: "" });
  const [pickupNodes, setPickupNodes] = useState<string[]>([""]);

  useEffect(() => {
    fetchRoutes();
    fetchEnrollments();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/transport?type=routes");
      if (res.ok) setRoutes(await res.json());
    } catch {
      toast.error("Failed to load routes");
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await fetch("/api/transport?type=enrollments");
      if (res.ok) setEnrollments(await res.json());
    } catch {}
  };

  const handleCreateRoute = async () => {
    if (!routeForm.name || !routeForm.vehicle_number || !routeForm.driver_name || !routeForm.driver_phone) {
      return toast.error("All route fields are required.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...routeForm,
          pickup_points: pickupNodes.filter(n => n.trim()),
        }),
      });
      if (res.ok) {
        toast.success("Route created successfully.");
        setRouteForm({ name: "", vehicle_number: "", driver_name: "", driver_phone: "" });
        setPickupNodes([""]);
        fetchRoutes();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create route");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = enrollments.reduce((s, e) => s + Number(e.amount), 0);
  const unpaidRevenue = enrollments.filter(e => !e.paid).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transport Management</h2>
          <p className="text-muted-foreground">Manage bus routes, drivers, and student transport subscriptions.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Bus className="h-4 w-4" /> Routes
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Enrollments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <div className="grid md:grid-cols-[1fr_380px] gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Active Routes</CardTitle>
                <CardDescription>Bus routes serving student transport needs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {routes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No routes defined. Create the first route.</p>
                ) : (
                  routes.map(route => (
                    <div key={route.id} className="border rounded-md p-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-primary">{route.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            {route.vehicle_number} | {route.driver_name} ({route.driver_phone})
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          {route._count.enrollments} enrolled
                        </Badge>
                      </div>
                      {(route.pickup_points as string[]).length > 0 && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-dashed">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Pickup Points:</p>
                          <div className="flex flex-wrap gap-2">
                            {(route.pickup_points as string[]).map((pt, idx) => (
                              <Badge variant="outline" key={idx} className="flex items-center gap-1 text-xs py-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" /> {pt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="bg-muted/40">
                <CardTitle className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Create Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Route Name</Label>
                  <Input placeholder="e.g. Tema Motorway Run" value={routeForm.name}
                    onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input placeholder="GN-1234-24" value={routeForm.vehicle_number}
                      onChange={e => setRouteForm({ ...routeForm, vehicle_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver Name</Label>
                    <Input placeholder="John Doe" value={routeForm.driver_name}
                      onChange={e => setRouteForm({ ...routeForm, driver_name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Driver Phone</Label>
                  <Input placeholder="0244XXXXXX" value={routeForm.driver_phone}
                    onChange={e => setRouteForm({ ...routeForm, driver_phone: e.target.value })} />
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label className="flex justify-between items-center">
                    <span>Pickup Points</span>
                    <Button variant="ghost" size="sm" onClick={() => setPickupNodes([...pickupNodes, ""])}
                      className="h-6 px-2 text-xs border border-dashed rounded">Add Point</Button>
                  </Label>
                  {pickupNodes.map((node, idx) => (
                    <Input key={idx} placeholder={`Pickup point ${idx + 1}...`} value={node}
                      onChange={e => {
                        const next = [...pickupNodes];
                        next[idx] = e.target.value;
                        setPickupNodes(next);
                      }} className="mb-2" />
                  ))}
                </div>
                <Button className="w-full font-bold mt-4" onClick={handleCreateRoute} disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Route"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle>Transport Enrollments</CardTitle>
                <CardDescription>Students subscribed to bus routes this term.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Revenue</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600">GHS {totalRevenue.toFixed(2)}</span>
                  {unpaidRevenue > 0 && (
                    <span className="text-xs text-destructive font-mono">GHS {unpaidRevenue.toFixed(2)} unpaid</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {enrollments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No enrollments found.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 uppercase text-xs border-b">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-2 py-3 text-right">Amount (GHS)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(enr => (
                      <tr key={enr.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-primary">
                          {enr.student.first_name} {enr.student.last_name}
                          <span className="text-xs text-muted-foreground font-mono ml-2">({enr.student.admission_number})</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{enr.term}</td>
                        <td className="px-4 py-3 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" /> {enr.route.name}
                        </td>
                        <td className="px-2 py-3 text-right font-bold">{Number(enr.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          {enr.paid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shadow-none">
                              <Ticket className="w-3 h-3 mr-1" /> PAID
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="shadow-none">
                              <ShieldAlert className="w-3 h-3 mr-1" /> UNPAID
                            </Badge>
                          )}
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
