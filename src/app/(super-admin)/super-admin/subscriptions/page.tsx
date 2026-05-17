"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, CreditCard, ShieldCheck, Zap } from "lucide-react";

type SubscriptionStats = Record<string, number>;

type SubscriptionSchool = {
  id: string;
  name: string;
  subscription_plan: string | null;
  created_at: string;
};

export default function SubscriptionsManagement() {
  const { data: session } = useSession();
  const [schools, setSchools] = useState<SubscriptionSchool[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/super-admin/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setSchools(data.schools);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.role === "SUPER_ADMIN") {
      fetchSubscriptions();
    }
  }, [session]);

  const planConfig: Record<string, { icon: any; color: string; label: string }> = {
    FREE_TRIAL: { icon: Zap, color: "text-amber-600 bg-amber-100", label: "Free Trial" },
    BASIC: { icon: Activity, color: "text-blue-600 bg-blue-100", label: "Basic Plan" },
    PREMIUM: { icon: ShieldCheck, color: "text-indigo-600 bg-indigo-100", label: "Premium Plan" },
    ENTERPRISE: { icon: CreditCard, color: "text-emerald-600 bg-emerald-100", label: "Enterprise" },
  };

  const getPlanDetails = (plan: string | null) => {
    const key = plan || "FREE_TRIAL";
    return planConfig[key] || { icon: Activity, color: "text-slate-600 bg-slate-100", label: key };
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscriptions Overview</h2>
        <p className="text-muted-foreground">
          Monitor and manage school subscriptions across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.keys(planConfig).map((planKey) => {
          const { icon: Icon, color, label } = planConfig[planKey];
          return (
            <Card key={planKey}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <div className={`p-2 rounded-full ${color.split(" ")[1]}`}>
                  <Icon className={`h-4 w-4 ${color.split(" ")[0]}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">{stats[planKey] || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Active Schools</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold">Recent Subscription Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>School Name</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Loading subscription data...
                  </TableCell>
                </TableRow>
              ) : schools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No schools found.
                  </TableCell>
                </TableRow>
              ) : (
                schools.map((school) => {
                  const details = getPlanDetails(school.subscription_plan);
                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <details.icon className={`h-4 w-4 ${details.color.split(" ")[0]}`} />
                          <span>{details.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(school.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
