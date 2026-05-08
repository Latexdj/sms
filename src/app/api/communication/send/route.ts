import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tenantPrisma } from "@/lib/prisma";
import { sendBulk } from "@/services/sms";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    
    const { target, content } = body;

    if (!target || !content) {
      return NextResponse.json({ error: "Missing payload params" }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);
    let recipients: string[] = [];

    if (target === "ALL_PARENTS") {
      const allStudents = await db.student.findMany({
        where: { status: "ACTIVE" },
        select: { parent_phone: true }
      });
      recipients = allStudents.map(s => s.parent_phone);
    } else if (target === "DEFAULTERS") {
      const defaulterInvoices = await db.invoice.findMany({
        where: { balance: { gt: 0 }, status: { in: ["OVERDUE", "PARTIAL", "PENDING"] } },
        include: { student: true }
      });
      recipients = defaulterInvoices.map(i => i.student.parent_phone);
    }

    recipients = [...new Set(recipients)].filter(Boolean);

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No valid recipient numbers found in target bounds" }, { status: 400 });
    }

    // Handled purely via wrapper utilizing native DB ledger decrements securely!
    const result = await sendBulk(schoolId, recipients, content);

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast complete. Target: ${result.attempted}, Sent successfully: ${result.successful}` 
    });

  } catch (error: any) {
    console.error("[BULK_COMMUNICATION_ERR]", error);
    return NextResponse.json({ error: "Internal API Dispatch Failure" }, { status: 500 });
  }
}
