import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateGESGrade } from "@/lib/grading";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const term = searchParams.get("term");
    const year = searchParams.get("academic_year");

    if (!classId || !term || !year) {
      return NextResponse.json({ error: "Missing params: class_id, term, academic_year" }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);

    // Fetch school info + report_config in parallel with exam lookup
    const [school, activeExam, classInfo] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          name: true, logo: true, motto: true,
          address: true, district: true, region: true,
          report_config: true,
        },
      }),
      db.exam.findFirst({
        where: { term, academic_year: year, type: "END_OF_TERM" },
      }),
      db.class.findFirst({
        where: { id: classId },
        select: { name: true, level: true },
      }),
    ]);

    if (!activeExam) {
      return NextResponse.json({ error: "No END_OF_TERM exam found for this term/year" }, { status: 404 });
    }

    const students = await db.student.findMany({
      where: { class_id: classId, status: "ACTIVE" },
      include: {
        exam_results: {
          where: { exam_id: activeExam.id },
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    });

    // Compute per-student aggregate totals for ranking
    const studentTotals = students.map(student => {
      let overallTotal = 0;
      const grades = student.exam_results.map(entry => {
        const classScore = entry.class_score.toNumber();
        const examScore = entry.exam_score.toNumber();
        const total = entry.total.toNumber();
        overallTotal += total;
        return {
          subject_id: entry.subject.id,
          subject: entry.subject.name,
          subject_code: entry.subject.code,
          class_score: classScore,
          exam_score: examScore,
          total,
          grade: entry.grade,
          remark: entry.remark,
          evaluated: calculateGESGrade(total),
        };
      });
      return {
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          first_name: student.first_name,
          last_name: student.last_name,
          admission: student.admission_number,
          gender: student.gender,
          dob: student.dob,
          photo_url: student.photo_url,
        },
        grades,
        overall_total: overallTotal,
        subject_count: grades.length,
        average: grades.length > 0 ? overallTotal / grades.length : 0,
      };
    });

    // Rank students by overall total (descending)
    const ranked = [...studentTotals].sort((a, b) => b.overall_total - a.overall_total);
    const rankMap = new Map<string, number>();
    ranked.forEach((s, idx) => rankMap.set(s.student.id, idx + 1));

    const reports = studentTotals.map(s => ({
      ...s,
      position: rankMap.get(s.student.id) ?? 0,
      total_in_class: students.length,
    }));

    return NextResponse.json({
      school_id: schoolId,
      term,
      academic_year: year,
      class: classInfo,
      school,
      report_config: school?.report_config ?? null,
      no_on_roll: students.length,
      reports,
    });
  } catch (err: any) {
    console.error("[TERMINAL_REPORT_ERR]", err);
    return NextResponse.json({ error: "Report engine failure" }, { status: 500 });
  }
}
