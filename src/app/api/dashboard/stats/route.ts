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
    const academicYear = searchParams.get("academic_year");
    const term = searchParams.get("term");

    const [
      totalStudents,
      totalTeachers,
      feesStats,
      todayAttendance,
      totalAttendance,
      topStudents,
      genderBreakdown,
    ] = await Promise.all([
      basePrisma.student.count({ where: { school_id: schoolId, status: "ACTIVE" } }),
      basePrisma.teacherProfile.count({ where: { school_id: schoolId, status: "ACTIVE" } }),
      basePrisma.invoice.aggregate({
        where: {
          school_id: schoolId,
          ...(academicYear ? { academic_year: academicYear } : {}),
          ...(term ? { term } : {}),
        },
        _sum: { amount_paid: true, balance: true },
      }),
      // Attendance for today
      basePrisma.attendance.groupBy({
        by: ["status"],
        where: {
          school_id: schoolId,
          date: new Date(new Date().toISOString().split("T")[0]),
        },
        _count: { status: true },
      }),
      // Total attendance records this month
      basePrisma.attendance.count({
        where: {
          school_id: schoolId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: "PRESENT",
        },
      }),
      // Top students by exam total
      basePrisma.examResult.groupBy({
        by: ["student_id"],
        where: {
          exam: { school_id: schoolId },
        },
        _avg: { total: true },
        orderBy: { _avg: { total: "desc" } },
        take: 5,
      }),
      // Gender breakdown
      basePrisma.student.groupBy({
        by: ["gender"],
        where: { school_id: schoolId, status: "ACTIVE" },
        _count: { gender: true },
      }),
    ]);

    // Compute attendance rate for today
    const presentCount = todayAttendance.find(r => r.status === "PRESENT")?._count?.status || 0;
    const absentCount = todayAttendance.find(r => r.status === "ABSENT")?._count?.status || 0;
    const lateCount = todayAttendance.find(r => r.status === "LATE")?._count?.status || 0;
    const totalMarked = presentCount + absentCount + lateCount;
    const attendanceRate = totalMarked > 0 ? ((presentCount + lateCount) / totalMarked) * 100 : 0;

    // Resolve top student names
    const studentIds = topStudents.map(s => s.student_id);
    const studentNames = await basePrisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, first_name: true, last_name: true },
    });
    const nameMap: Record<string, string> = {};
    studentNames.forEach(s => { nameMap[s.id] = `${s.first_name} ${s.last_name}`; });

    const topStudentsFormatted = topStudents.map(s => ({
      name: nameMap[s.student_id] || "Unknown",
      score: Math.round(Number(s._avg.total) || 0),
    }));

    const genderData = genderBreakdown.map(g => ({
      name: g.gender === "M" ? "Male" : g.gender === "F" ? "Female" : g.gender,
      value: g._count.gender,
    }));

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      feesCollected: Number(feesStats._sum.amount_paid || 0),
      feesOutstanding: Number(feesStats._sum.balance || 0),
      attendanceToday: Math.round(attendanceRate * 10) / 10,
      genderData,
      topStudents: topStudentsFormatted,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
