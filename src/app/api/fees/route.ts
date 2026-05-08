import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

// GET: Fetch invoices with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status");
    const term = searchParams.get("term");
    const academicYear = searchParams.get("academic_year");
    const type = searchParams.get("type"); // "invoices" | "structures" | "stats"

    if (type === "structures") {
      const structures = await basePrisma.feeStructure.findMany({
        where: { school_id: schoolId, ...(academicYear ? { academic_year: academicYear } : {}) },
        include: { class: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(structures);
    }

    if (type === "stats") {
      const [total, paid, pending, overdue] = await Promise.all([
        basePrisma.invoice.aggregate({ where: { school_id: schoolId }, _sum: { total_amount: true, amount_paid: true, balance: true }, _count: true }),
        basePrisma.invoice.count({ where: { school_id: schoolId, status: "PAID" } }),
        basePrisma.invoice.count({ where: { school_id: schoolId, status: "PENDING" } }),
        basePrisma.invoice.count({ where: { school_id: schoolId, status: "OVERDUE" } }),
      ]);
      return NextResponse.json({
        total_invoices: total._count,
        total_billed: Number(total._sum.total_amount || 0),
        total_collected: Number(total._sum.amount_paid || 0),
        total_balance: Number(total._sum.balance || 0),
        paid_count: paid,
        pending_count: pending,
        overdue_count: overdue,
      });
    }

    // Default: list invoices
    const where: any = { school_id: schoolId };
    if (status) where.status = status;
    if (term) where.term = term;
    if (academicYear) where.academic_year = academicYear;
    if (q) {
      where.student = {
        OR: [
          { first_name: { contains: q, mode: "insensitive" } },
          { last_name: { contains: q, mode: "insensitive" } },
          { admission_number: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const invoices = await basePrisma.invoice.findMany({
      where,
      include: {
        student: { select: { id: true, first_name: true, last_name: true, admission_number: true } },
        payments: { orderBy: { paid_at: "desc" }, take: 1 },
      },
      orderBy: { student: { first_name: "asc" } },
      take: 100,
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[FEES_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST: Bulk generate invoices for a class + term
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { class_id, academic_year, term } = body;

    if (!class_id || !academic_year || !term) {
      return NextResponse.json({ error: "class_id, academic_year, and term are required" }, { status: 400 });
    }

    // Get fee structures for that class
    const structures = await basePrisma.feeStructure.findMany({
      where: { school_id: schoolId, class_id, academic_year },
    });

    if (structures.length === 0) {
      return NextResponse.json({ error: "No fee structures found for this class and academic year" }, { status: 400 });
    }

    const totalAmount = structures.reduce((sum, s) => sum + Number(s.amount), 0);

    // Get all active students in that class
    const students = await basePrisma.student.findMany({
      where: { school_id: schoolId, class_id, status: "ACTIVE" },
    });

    // Create invoices (skip if already exists)
    let created = 0;
    for (const student of students) {
      const existing = await basePrisma.invoice.findFirst({
        where: { school_id: schoolId, student_id: student.id, academic_year, term },
      });
      if (!existing) {
        await basePrisma.invoice.create({
          data: {
            school_id: schoolId,
            student_id: student.id,
            academic_year,
            term,
            total_amount: totalAmount,
            amount_paid: 0,
            balance: totalAmount,
            status: "PENDING",
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, created, total_students: students.length });
  } catch (error) {
    console.error("[FEES_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
