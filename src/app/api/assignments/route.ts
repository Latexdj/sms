import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");

    const where: any = { school_id: schoolId };
    if (classId) where.class_id = classId;
    if (subjectId) where.subject_id = subjectId;

    const assignments = await basePrisma.assignment.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { due_date: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const userId = (session.user as any).id;
    const body = await req.json();

    const { title, description, due_date, total_marks, subject_id, class_id } = body;

    if (!title || !due_date || !subject_id || !class_id) {
      return NextResponse.json(
        { error: "Title, due date, subject, and class are required." },
        { status: 400 }
      );
    }

    const assignment = await basePrisma.assignment.create({
      data: {
        school_id: schoolId,
        class_id,
        subject_id,
        title,
        description: description || null,
        due_date: new Date(due_date),
        total_marks: Number(total_marks) || 100,
        created_by: userId,
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("[ASSIGNMENTS_POST]", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
