import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacher_id");

    if (!teacherId) return NextResponse.json({ error: "Teacher identifier boundary required" }, { status: 400 });

    const db = tenantPrisma(schoolId);

    // 1. Extrapolated Attendance Logic: How many unique dates did this Teacher execute `marked_by`?
    // GroupBy natively captures unique date matrices smoothly
    const uniqueDatesMarked = await db.attendance.groupBy({
       by: ['date'],
       where: { marked_by: teacherId, school_id: schoolId }
    });
    
    // We proxy days present based cleanly on physical execution hooks spanning student ledgers!
    const extrapolatedDaysPresent = uniqueDatesMarked.length;

    // 2. Grading Completion Logic: Array of Assignments created vs Array of Students graded structurally
    const createdAssignments = await db.assignment.findMany({
       where: { created_by: teacherId },
       include: {
          class: { include: { _count: { select: { students: true } } } },
          _count: { select: { submissions: true } }
       }
    });

    let totalExpectedSubmissions = 0;
    let totalGradedSubmissions = 0;

    createdAssignments.forEach(assignment => {
       // Limit maps strictly explicitly extracting active students in the target class
       const expected = assignment.class._count.students; 
       totalExpectedSubmissions += expected;
       
       totalGradedSubmissions += assignment._count.submissions;
    });

    // Handle divided by zero organically 
    const completionRate = totalExpectedSubmissions === 0 
       ? 100 
       : Math.round((totalGradedSubmissions / totalExpectedSubmissions) * 100);

    return NextResponse.json({
       teacher_id: teacherId,
       metrics: {
          extrapolated_days_present: extrapolatedDaysPresent,
          grading_completion_percentage: completionRate,
          total_assignments_issued: createdAssignments.length
       }
    });

  } catch (error: any) {
    console.error("[HR_PERFORMANCE_API_ERR]", error);
    return NextResponse.json({ error: "Extrapolation Matrix Server Fault" }, { status: 500 });
  }
}
