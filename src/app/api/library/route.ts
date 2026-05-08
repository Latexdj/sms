import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

const LIBRARY_ROLES = ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "LIBRARIAN"];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!LIBRARY_ROLES.includes(role)) return new NextResponse("Forbidden", { status: 403 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "books" | "loans" | "overdue"
    const q = searchParams.get("q") || "";

    if (type === "loans" || type === "overdue") {
      const loans = await basePrisma.bookLoan.findMany({
        where: {
          book: { school_id: schoolId },
          ...(type === "overdue" ? { status: "OVERDUE" } : { status: { in: ["BORROWED", "OVERDUE"] } }),
        },
        include: {
          book: { select: { id: true, title: true, isbn: true } },
          student: { select: { id: true, first_name: true, last_name: true, admission_number: true } },
        },
        orderBy: { due_date: "asc" },
      });
      return NextResponse.json(loans);
    }

    // Default: books catalog
    const where: any = { school_id: schoolId };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { isbn: { contains: q } },
      ];
    }

    const books = await basePrisma.book.findMany({
      where,
      orderBy: { title: "asc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("[LIBRARY_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!LIBRARY_ROLES.includes(role)) return new NextResponse("Forbidden", { status: 403 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { action } = body;

    if (action === "checkout") {
      const { admission_number, isbn, loan_days } = body;
      if (!admission_number || !isbn) {
        return NextResponse.json({ error: "admission_number and isbn are required" }, { status: 400 });
      }

      const student = await basePrisma.student.findFirst({
        where: { school_id: schoolId, admission_number: admission_number.toUpperCase() },
      });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

      const book = await basePrisma.book.findFirst({
        where: { school_id: schoolId, isbn },
      });
      if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
      if (book.copies_available <= 0) return NextResponse.json({ error: "No copies available" }, { status: 400 });

      const days = Number(loan_days) || 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const [loan] = await basePrisma.$transaction([
        basePrisma.bookLoan.create({
          data: {
            book_id: book.id,
            student_id: student.id,
            due_date: dueDate,
            status: "BORROWED",
          },
          include: {
            book: { select: { title: true } },
            student: { select: { first_name: true, last_name: true } },
          },
        }),
        basePrisma.book.update({
          where: { id: book.id },
          data: { copies_available: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json(loan);
    }

    if (action === "add_book") {
      const { title, author, isbn, category, copies_total } = body;
      if (!title || !author) return NextResponse.json({ error: "title and author required" }, { status: 400 });
      const copies = Number(copies_total) || 1;
      const book = await basePrisma.book.create({
        data: {
          school_id: schoolId,
          title,
          author,
          isbn: isbn || null,
          category: category || null,
          copies_total: copies,
          copies_available: copies,
        },
      });
      return NextResponse.json(book);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[LIBRARY_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!LIBRARY_ROLES.includes(role)) return new NextResponse("Forbidden", { status: 403 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { loan_id } = body;

    if (!loan_id) return NextResponse.json({ error: "loan_id required" }, { status: 400 });

    const loan = await basePrisma.bookLoan.findFirst({
      where: { id: loan_id, book: { school_id: schoolId } },
    });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    if (loan.status === "RETURNED") return NextResponse.json({ error: "Already returned" }, { status: 400 });

    const [updated] = await basePrisma.$transaction([
      basePrisma.bookLoan.update({
        where: { id: loan_id },
        data: { status: "RETURNED", returned_at: new Date() },
      }),
      basePrisma.book.update({
        where: { id: loan.book_id },
        data: { copies_available: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[LIBRARY_PUT]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
