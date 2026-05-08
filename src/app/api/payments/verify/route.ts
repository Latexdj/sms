import { NextResponse } from "next/server";
import { verifyTransaction } from "@/services/paystack";
import { tenantPrisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return new NextResponse("Missing exact reference", { status: 400 });
    }

    // 1. Hit Paystack verification endpoint securely protecting against falsified redirects
    const paystackLookup = await verifyTransaction(reference);

    if (paystackLookup.data.status === "success") {
      // 2. Parse the routing footprint
      // format format: [invoiceId]_SCHOOL_[schoolId]_TIME_[timestamp]
      const referenceParts = reference.split("_SCHOOL_");
      if (referenceParts.length < 2) return NextResponse.redirect(new URL("/dashboard", req.url));

      const invoiceId = referenceParts[0];
      const schoolId = referenceParts[1].split("_TIME_")[0];

      const db = tenantPrisma(schoolId);
      
      // Perform atomic transaction resolving accounting ledger
      await db.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) return;

        // Prevent Duplicate Processings of the exact same reference
        const existingPayment = await tx.payment.findUnique({ where: { reference } });
        if (existingPayment) return;

        const paidAmount = paystackLookup.data.amount / 100; // Return from kobo

        const newAmountPaid = invoice.amount_paid.toNumber() + paidAmount;
        const newBalance = invoice.total_amount.toNumber() - newAmountPaid;

        let newStatus = invoice.status;
        if (newBalance <= 0) newStatus = "PAID";
        else if (newAmountPaid > 0) newStatus = "PARTIAL";

        await tx.payment.create({
          data: {
            invoice_id: invoiceId,
            amount: paidAmount,
            method: "PAYSTACK",
            reference: reference, // Lock it uniquely
            recorded_by: "USER_REDIRECT", 
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
      
      // Successfully secured everything! Redirect parent back to the frontend with Success token
      return NextResponse.redirect(new URL(`/dashboard/fees?success=true&ref=${reference}`, req.url));
    }

    // Verification failed logic (e.g. abandoned transaction)
    return NextResponse.redirect(new URL(`/dashboard/fees?error=verification_failed`, req.url));
  } catch (error: any) {
    console.error("[PAYMENTS_VERIFY_ERR]", error);
    return NextResponse.redirect(new URL(`/dashboard/fees?error=system_error`, req.url));
  }
}
