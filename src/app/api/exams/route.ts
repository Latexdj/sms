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
    const term = searchParams.get("term");
    const academicYear = searchParams.get("academic_year");

    const where: any = { school_id: schoolId };
    if (term) where.term = term;
    if (academicYear) where.academic_year = academicYear;

    const exams = await basePrisma.exam.findMany({
      where,
      include: { _count: { select: { results: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("[EXAMS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { name, term, academic_year, type } = body;

    if (!name || !term || !academic_year || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exam = await basePrisma.exam.create({
      data: { school_id: schoolId, name, term, academic_year, type },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAMS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
