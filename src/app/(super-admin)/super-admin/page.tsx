"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, Activity } from "lucide-react";
import { useSession } from "next-auth/react";

interface SuperAdminStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalUsers: number;
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/super-admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch super admin stats", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.role === "SUPER_ADMIN") {
      fetchStats();
    }
  }, [session]);

  const statCards = [
    {
      title: "Total Schools",
      value: stats.totalSchools.toString(),
      icon: Building2,
      description: "Registered schools on the platform",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions.toString(),
      icon: Activity,
      description: "Currently active subscriptions",
    },
    {
      title: "Total Revenue",
      value: `GHS ${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      description: "Total revenue generated",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      icon: Users,
      description: "Total users across all schools",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}. Here's an overview of the platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">{card.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Additional sections can be added here, like recent schools, etc. */}
    </div>
  );
}
