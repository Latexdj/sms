import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import { sendSingle } from "@/services/sms";

// Callback endpoint provided specifically to MTN MoMo Collection request metadata
export async function POST(req: Request) {
  try {
    const body = await req.json();

    /* 
      Example MTN Collection Callback Body payload:
      {
        "financialTransactionId": "1234567890",
        "externalId": "INV_123_SCHOOL_ABC", 
        "amount": "500",
        "currency": "GHS",
        "status": "SUCCESSFUL"
      }
    */

    const { status, externalId, financialTransactionId, amount } = body;

    // externalId usually contains routing info e.g. [invoiceId]_[schoolId]
    if (status === "SUCCESSFUL" && externalId) {
      const [invoiceId, schoolId] = externalId.split("_SCHOOL_");

      if (invoiceId && schoolId) {
        const db = tenantPrisma(schoolId);
        
        await db.$transaction(async (tx) => {
          const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
          if (!invoice) return;

          const numericAmount = parseFloat(amount);
          const newAmountPaid = invoice.amount_paid.toNumber() + numericAmount;
          const newBalance = invoice.total_amount.toNumber() - newAmountPaid;

          let newStatus = invoice.status;
          if (newBalance <= 0) newStatus = "PAID";
          else if (newAmountPaid > 0) newStatus = "PARTIAL";

          await tx.payment.create({
            data: {
              invoice_id: invoiceId,
              amount: numericAmount,
              method: "MOMO",
              reference: financialTransactionId,
              recorded_by: "SYSTEM_WEBHOOK", 
            }
          });

          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              amount_paid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
            }
          });
        });

        // Outside atomic sequence: Dispart Auto-SMS receipt natively
        const completedInvoice = await db.invoice.findUnique({
          where: { id: invoiceId }, 
          include: { student: true, school: true }
        });
        
        if (completedInvoice) {
           const { student, balance, school } = completedInvoice;
           const receiptMsg = `${school.name}: Payment received of GHS ${parseFloat(amount).toFixed(2)} for ${student.first_name}. Remaining Balance: GHS ${balance.toFixed(2)}.`;
           await sendSingle(schoolId, student.parent_phone, receiptMsg);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MOMO_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal API Error", { status: 500 });
  }
}
