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
    const teacherId = searchParams.get("teacher_id");

    const where: any = { school_id: schoolId };
    if (teacherId) where.teacher_id = teacherId;

    const subjects = await basePrisma.subject.findMany({
      where,
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("[SUBJECTS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { name, code, teacher_id } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = await basePrisma.subject.create({
      data: { school_id: schoolId, name, code, teacher_id: teacher_id || null },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("[SUBJECTS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
