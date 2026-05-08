import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academic_year");

    const where: any = { school_id: schoolId };
    if (academicYear) where.academic_year = academicYear;

    // Teachers only see classes they are assigned to via timetable
    if (role === "TEACHER") {
      const teacherSlots = await basePrisma.timetable.findMany({
        where: { teacher_id: userId, school_id: schoolId },
        select: { class_id: true },
        distinct: ["class_id"],
      });
      where.id = { in: teacherSlots.map((s) => s.class_id) };
    }

    const classes = await basePrisma.class.findMany({
      where,
      include: { _count: { select: { students: true } } },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN", "HEADTEACHER"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { name, level, academic_year } = body;

    if (!name || !level || !academic_year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cls = await basePrisma.class.create({
      data: { school_id: schoolId, name, level, academic_year },
    });

    return NextResponse.json(cls);
  } catch (error) {
    console.error("[CLASSES_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
