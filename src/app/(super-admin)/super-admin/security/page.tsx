"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Security Oversight</h2>
        <p className="text-muted-foreground">Monitor security alerts, audit logs, and compliance status across the SaaS infrastructure.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800"><ShieldAlert className="h-5 w-5"/> System Status: Secure</CardTitle>
            <CardDescription className="text-emerald-700">No active threats detected. Multi-tenant isolation is strictly enforced at the ORM level.</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 border-b pb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Multiple Failed Logins</h4>
                  <p className="text-sm text-muted-foreground">Detected 5 failed login attempts from IP 192.168.1.45 targeting School ID 102.</p>
                  <Badge variant="outline" className="mt-2 text-amber-700 bg-amber-50">Investigating</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
