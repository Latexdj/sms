import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";
import { compileRowTotals } from "@/lib/grading";

// GET: Fetch results for a specific exam + class + subject
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("exam_id");
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");

    if (!examId || !classId || !subjectId) {
      return NextResponse.json({ error: "exam_id, class_id, and subject_id are required" }, { status: 400 });
    }

    // Verify the exam belongs to this school
    const exam = await basePrisma.exam.findFirst({ where: { id: examId, school_id: schoolId } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Get all students in the class
    const students = await basePrisma.student.findMany({
      where: { class_id: classId, school_id: schoolId, status: "ACTIVE" },
      orderBy: { first_name: "asc" },
    });

    // Get existing results for those students
    const existingResults = await basePrisma.examResult.findMany({
      where: {
        exam_id: examId,
        subject_id: subjectId,
        student_id: { in: students.map(s => s.id) },
      },
    });

    const resultsMap: Record<string, any> = {};
    existingResults.forEach(r => { resultsMap[r.student_id] = r; });

    const rows = students.map(student => {
      const result = resultsMap[student.id];
      return {
        student_id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission_number: student.admission_number,
        class_score: result ? Number(result.class_score) : 0,
        exam_score: result ? Number(result.exam_score) : 0,
        total: result ? Number(result.total) : 0,
        grade: result ? result.grade : 9,
        remark: result ? result.remark : "Absent",
        result_id: result?.id || null,
      };
    });

    return NextResponse.json({ exam, rows });
  } catch (error) {
    console.error("[EXAM_RESULTS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST: Upsert bulk exam results for a class/subject/exam
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { exam_id, subject_id, rows } = body;
    // rows: [{ student_id, class_score, exam_score }]

    if (!exam_id || !subject_id || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exam = await basePrisma.exam.findFirst({ where: { id: exam_id, school_id: schoolId } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const upserts = rows.map((row: any) => {
      const cs = Number(row.class_score);
      const es = Number(row.exam_score);
      const computed = compileRowTotals(cs, es);
      return basePrisma.examResult.upsert({
        where: {
          exam_id_student_id_subject_id: {
            exam_id,
            student_id: row.student_id,
            subject_id,
          },
        },
        update: {
          class_score: cs,
          exam_score: es,
          total: computed.total,
          grade: computed.grade,
          remark: computed.remark,
        },
        create: {
          exam_id,
          student_id: row.student_id,
          subject_id,
          class_score: cs,
          exam_score: es,
          total: computed.total,
          grade: computed.grade,
          remark: computed.remark,
        },
      });
    });

    await Promise.all(upserts);

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error("[EXAM_RESULTS_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
