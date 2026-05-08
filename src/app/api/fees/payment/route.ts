import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { admission_number, amount, method, reference } = body;

    if (!admission_number || !amount || !method) {
      return NextResponse.json({ error: "admission_number, amount, and method are required" }, { status: 400 });
    }

    // Find the student
    const student = await basePrisma.student.findFirst({
      where: { school_id: schoolId, admission_number },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Find the oldest unpaid invoice for this student
    const invoice = await basePrisma.invoice.findFirst({
      where: {
        school_id: schoolId,
        student_id: student.id,
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
      orderBy: { academic_year: "asc" },
    });
    if (!invoice) return NextResponse.json({ error: "No outstanding invoices found for this student" }, { status: 404 });

    const payAmount = Number(amount);
    const newAmountPaid = Number(invoice.amount_paid) + payAmount;
    const newBalance = Number(invoice.total_amount) - newAmountPaid;
    const newStatus = newBalance <= 0 ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : "PENDING";

    await basePrisma.$transaction([
      basePrisma.payment.create({
        data: {
          invoice_id: invoice.id,
          amount: payAmount,
          method: method as any,
          reference: reference || null,
          recorded_by: userId,
        },
      }),
      basePrisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amount_paid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus as any,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      new_balance: Math.max(0, newBalance),
      status: newStatus,
    });
  } catch (error) {
    console.error("[FEE_PAYMENT_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
