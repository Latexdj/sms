import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateGESGrade } from "@/lib/grading";

// Aggregates massive historic MOCK parameters calculating realistic BECE mapping outcomes
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student_id");

    if (!studentId) {
      return NextResponse.json({ error: "Target Student limits required" }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);

    // Filter purely against explicit structural "MOCK" examination frameworks
    const mockResults = await db.examResult.findMany({
      where: {
        student_id: studentId,
        exam: { type: "MOCK" }
      },
      include: { subject: true, exam: true }
    });

    if (mockResults.length === 0) {
      return NextResponse.json({ message: "No Mock Examinations found inside tracking bounds." }, { status: 404 });
    }

    // Group subjects sequentially calculating strict average performance dynamically
    const subjectMathEngine: Record<string, { totalScores: number, count: number, name: string }> = {};

    mockResults.forEach(result => {
      const sbjId = result.subject_id;
      if (!subjectMathEngine[sbjId]) {
        subjectMathEngine[sbjId] = { totalScores: 0, count: 0, name: result.subject.name };
      }
      subjectMathEngine[sbjId].totalScores += result.total.toNumber();
      subjectMathEngine[sbjId].count += 1;
    });

    let overallAggregate = 0;
    const corePredictions = Object.keys(subjectMathEngine).map(sbjId => {
      const mathObj = subjectMathEngine[sbjId];
      const avg = Math.round(mathObj.totalScores / mathObj.count);
      const prediction = calculateGESGrade(avg); // Parse 1-9 BECE rating directly

      overallAggregate += prediction.grade;

      return {
        subject: mathObj.name,
        historic_average: avg,
        predicted_grade: prediction.grade,
        predicted_remark: prediction.remark
      };
    });

    return NextResponse.json({
      student_id: studentId,
      school_id: schoolId,
      bece_aggregate_prediction: overallAggregate, // e.g. "Aggregate 8" or "Aggregate 12"
      subject_predictions: corePredictions
    });

  } catch (err: any) {
    console.error("[BECE_PREDICTION_ERR]", err);
    return NextResponse.json({ error: "Prediction Server Integration Factory Failed" }, { status: 500 });
  }
}
