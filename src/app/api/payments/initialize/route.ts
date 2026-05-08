import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initializeTransaction } from "@/services/paystack";
import { requestToPay } from "@/services/momo";
import { tenantPrisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    
    // method can be 'PAYSTACK' or 'MOMO'
    const { invoiceId, method, phone } = body;

    if (!invoiceId || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: true }
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.balance.toNumber() <= 0) return NextResponse.json({ error: "Invoice fully paid" }, { status: 400 });

    const amountFloat = invoice.balance.toNumber();
    
    // Map externalId explicitly to contain our routing logic for Callbacks
    const referenceRoot = `${invoice.id}_SCHOOL_${schoolId}`;

    if (method === "PAYSTACK") {
      // 1. Initialize Paystack
      // Attach timestamp to prevent reference duplication collisions on retries
      const uniqueRef = `${referenceRoot}_TIME_${Date.now()}`;
      const callbackUrl = `${process.env.NEXTAUTH_URL}/api/payments/verify?reference=${uniqueRef}`;
      const email = session.user.email || invoice.student.parent_phone + "@smshub.com"; // Fallback email

      const paystackRes = await initializeTransaction(email, amountFloat, uniqueRef, callbackUrl);

      // Return the generated redirect URL to securely bounce the parent to Paystack's UI
      return NextResponse.json({ gateway_url: paystackRes.data.authorization_url });
    } 
    
    if (method === "MOMO") {
      // 2. Initialize MoMo Push
      if (!phone) return NextResponse.json({ error: "MoMo requires billing phone number" }, { status: 400 });

      await requestToPay(phone, amountFloat, referenceRoot);

      // MoMo is push-based, no URL. Parent receives prompt on their device.
      return NextResponse.json({ 
        message: "Payment prompt dispatched to your device.",
        method: "MOMO"
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  } catch (error: any) {
    console.error("[PAYMENTS_INITIALIZE_ERR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
