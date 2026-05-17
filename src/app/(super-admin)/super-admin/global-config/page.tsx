"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Save } from "lucide-react";

export default function GlobalConfigPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Global Configurations</h2>
        <p className="text-muted-foreground">Manage platform-wide settings that affect all tenants.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/> Default Tenant Settings</CardTitle>
            <CardDescription>Configure the default values applied to newly registered schools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label>Default SMS Credits</Label>
              <Input type="number" defaultValue={1000} />
            </div>
            <div className="space-y-2 max-w-md">
              <Label>Default Currency</Label>
              <Input defaultValue="GHS" disabled />
            </div>
            <Button className="mt-4"><Save className="mr-2 h-4 w-4"/> Save Configurations</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
