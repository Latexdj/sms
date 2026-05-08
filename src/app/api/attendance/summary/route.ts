import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tenantPrisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    
    const classId = searchParams.get("class_id");
    const month = searchParams.get("month"); // Format: YYYY-MM
    
    if (!classId || !month) {
      return NextResponse.json({ error: "Missing mapping params" }, { status: 400 });
    }

    const [yearStr, monthStr] = month.split("-");
    const yearNum = parseInt(yearStr);
    const monthNum = parseInt(monthStr) - 1; // 0-indexed Date object parameters

    // Calculate beginning and exact ending Date limitations natively
    const startDate = new Date(Date.UTC(yearNum, monthNum, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59));

    const db = tenantPrisma(schoolId);

    // Grab all Attendance matrices strictly scoped under this array timeline
    const attendanceRecords = await db.attendance.findMany({
      where: {
        class_id: classId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalCount = attendanceRecords.length;
    if (totalCount === 0) {
      // Empty arrays default percentages cleanly to explicitly 0
      return NextResponse.json({
        total: 0,
        present_perc: 0,
        absent_perc: 0,
        late_perc: 0,
        excused_perc: 0
      });
    }

    const tally = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    attendanceRecords.forEach(r => tally[r.status] += 1);

    return NextResponse.json({
      total: totalCount,
      present_perc: Math.round((tally.PRESENT / totalCount) * 100),
      absent_perc: Math.round((tally.ABSENT / totalCount) * 100),
      late_perc: Math.round((tally.LATE / totalCount) * 100),
      excused_perc: Math.round((tally.EXCUSED / totalCount) * 100)
    });

  } catch (error: any) {
    console.error("[ATTENDANCE_SUMMARY_ERR]", error);
    return NextResponse.json({ error: "Summary Aggregation Server Fault" }, { status: 500 });
  }
}
