import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import { sendSingle } from "@/services/sms";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.json();
    const rawBody = JSON.stringify(body);

    const secret = process.env.PAYSTACK_SECRET_KEY || "YOUR_SECRET_KEY";

    // Validate event using cryptographic HMAC digest mapping to Paystack spec
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const { event, data } = body;

    if (event === "charge.success") {
      // Find the Invoice mapping via metadata attached to the transaction
      // e.g. data.metadata.invoice_id && data.metadata.school_id
      const invoiceId = data.metadata?.invoice_id;
      const schoolId = data.metadata?.school_id;

      if (invoiceId && schoolId) {
        const db = tenantPrisma(schoolId);
        
        // Amount comes natively in kobo (or pesewas natively for GHS) - so we divide by 100
        const paidAmount = data.amount / 100;

        await db.$transaction(async (tx) => {
          const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
          if (!invoice) return;

          const newAmountPaid = invoice.amount_paid.toNumber() + paidAmount;
          const newBalance = invoice.total_amount.toNumber() - newAmountPaid;

          let newStatus = invoice.status;
          if (newBalance <= 0) newStatus = "PAID";
          else if (newAmountPaid > 0) newStatus = "PARTIAL";

          // Log the raw payment
          await tx.payment.create({
            data: {
              invoice_id: invoiceId,
              amount: paidAmount,
              method: "PAYSTACK",
              reference: data.reference,
              recorded_by: "SYSTEM_WEBHOOK", // Automated System record
            }
          });

          // Mutate the parent Invoice safely
          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              amount_paid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
            }
          });
        });

        // Outside atomic sequence: Dispart Auto-SMS receipt bounds reliably
        const completedInvoice = await db.invoice.findUnique({
          where: { id: invoiceId }, 
          include: { student: true, school: true }
        });
        
        if (completedInvoice) {
           const { student, balance, school } = completedInvoice;
           const receiptMsg = `${school.name}: Payment received of GHS ${paidAmount.toFixed(2)} for ${student.first_name}. Remaining Balance: GHS ${balance.toFixed(2)}.`;
           await sendSingle(schoolId, student.parent_phone, receiptMsg);
        }
      }
    }

    // Always respond 200 OK immediately for Event consumption queues
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal API Error", { status: 500 });
  }
}
