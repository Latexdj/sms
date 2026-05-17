"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & SaaS Operations</h2>
        <p className="text-muted-foreground">Manage Paystack integrations, SaaS revenue, and payouts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5"/> Platform Revenue</CardTitle>
            <CardDescription>Total aggregated revenue from SaaS subscriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">GHS 45,200.00</div>
            <p className="text-sm text-muted-foreground mt-2">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateways</CardTitle>
            <CardDescription>Global gateway status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Paystack</span>
              <span className="text-emerald-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">MTN MoMo</span>
              <span className="text-emerald-600 font-medium">Connected</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
