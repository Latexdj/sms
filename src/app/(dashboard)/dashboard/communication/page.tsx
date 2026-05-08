"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, CalendarClock, AlertTriangle, ListChecks, Loader2 } from "lucide-react";

const SMS_TEMPLATES = [
  { id: "fee_remind", label: "Fee Reminder", text: "Dear Parent, this is a gentle reminder that school fees are currently overdue. Please process payment at your earliest convenience." },
  { id: "event_notice", label: "Event Notice", text: "SchoolMS Notice: Important PTA Meeting scheduled for this Saturday at 9:00 AM on the campus grounds. Kindly attend." },
  { id: "absence", label: "Absence Alert", text: "Alert: Your ward was marked absent from academic sessions today. Please contact the Headteacher's office to clarify." },
];

type SmsLog = {
  id: string;
  recipient_phone: string;
  status: string;
  cost: string;
  sent_at: string;
};

export default function CommunicationDashboard() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [targetGroup, setTargetGroup] = useState("ALL_PARENTS");
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/communication");
      if (res.ok) setLogs(await res.json());
    } catch {
      // Silently fail — logs are secondary
    } finally {
      setLogsLoading(false);
    }
  };

  const applyTemplate = (text: string) => setContent(text);

  const handleDispatch = async () => {
    if (!content.trim()) {
      toast.warning("Message content cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/communication/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetGroup, content }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setContent("");
        fetchLogs();
      } else {
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Communication Center</h2>
          <p className="text-muted-foreground">Broadcast SMS alerts to parents via Hubtel.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        {/* Broadcast Composer */}
        <Card className="flex flex-col border-primary/20 shadow-md">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-primary flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Compose Broadcast
            </CardTitle>
            <CardDescription>Messages deduct 1 credit per 160 characters. Keep it concise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 pt-6">
            <div className="space-y-2">
              <Label>Target Group</Label>
              <select
                value={targetGroup}
                onChange={e => setTargetGroup(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ALL_PARENTS">All Active Parents</option>
                <option value="DEFAULTERS">Fee Defaulters Only</option>
              </select>
              {targetGroup === "DEFAULTERS" && (
                <p className="text-xs text-destructive font-medium flex items-center bg-destructive/10 p-2 rounded mt-2">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Targeting only households with outstanding invoice balances.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {SMS_TEMPLATES.map(tmpl => (
                  <Badge
                    key={tmpl.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1"
                    onClick={() => applyTemplate(tmpl.text)}
                  >
                    {tmpl.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <span className={`text-xs font-semibold ${content.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                  {content.length} / 160 {content.length > 160 && "(Multi-part SMS)"}
                </span>
              </div>
              <Textarea
                placeholder="Type your message here..."
                className="h-36 resize-none bg-muted/20"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2 bg-muted/10 border-t">
            <Button size="lg" onClick={handleDispatch} disabled={loading} className="w-full font-bold">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : "Send Bulk Broadcast"}
            </Button>
          </CardFooter>
        </Card>

        {/* SMS Logs */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5" /> Recent Dispatch Logs
            </CardTitle>
            <CardDescription>Last 50 SMS records for this school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto max-h-[500px]">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm italic">No messages sent yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 hover:bg-muted/30 px-2 py-1 rounded-md transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium text-primary font-mono text-xs">{log.recipient_phone}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(log.sent_at)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge
                      variant={log.status === "SENT" ? "default" : log.status === "FAILED" ? "destructive" : "secondary"}
                      className="text-[10px] h-4"
                    >
                      {log.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono mt-1">
                      GHS {Number(log.cost).toFixed(4)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
