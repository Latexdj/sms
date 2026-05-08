import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

// GET: Fetch students with filtering, scoped by role
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const classId = searchParams.get("class_id");
    const status = searchParams.get("status");

    const whereClause: any = { school_id: schoolId };

    if (q) {
      whereClause.OR = [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { admission_number: { contains: q, mode: "insensitive" } },
      ];
    }

    if (classId) {
      whereClause.class_id = classId;
    } else if (role === "TEACHER") {
      // Teachers only see students in their assigned classes
      const teacherSlots = await basePrisma.timetable.findMany({
        where: { teacher_id: userId, school_id: schoolId },
        select: { class_id: true },
        distinct: ["class_id"],
      });
      const teacherClassIds = teacherSlots.map((s) => s.class_id);
      whereClause.class_id = { in: teacherClassIds };
    }

    if (status) whereClause.status = status;

    const students = await basePrisma.student.findMany({
      where: whereClause,
      include: { class: true },
      orderBy: { first_name: "asc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST: Add a single student or bulk ingest via CSV — admin/headteacher only
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN", "HEADTEACHER"].includes(role)) {
      return NextResponse.json(
        { error: "Only administrators can add new admissions." },
        { status: 403 }
      );
    }

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();

    if (Array.isArray(body)) {
      const payload = body.map((student: any) => ({
        ...student,
        school_id: schoolId,
        dob: new Date(student.dob),
      }));

      const result = await basePrisma.student.createMany({
        data: payload,
        skipDuplicates: true,
      });

      return NextResponse.json({ success: true, count: result.count });
    } else {
      body.dob = new Date(body.dob);
      body.school_id = schoolId;

      const student = await basePrisma.student.create({ data: body });
      return NextResponse.json(student);
    }
  } catch (error) {
    console.error("[STUDENTS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
