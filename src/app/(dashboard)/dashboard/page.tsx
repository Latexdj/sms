import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ academic_year?: string; term?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name ?? "there";

  if (role === "TEACHER") {
    // --- Teacher-specific data ---
    const teacherSlots = await basePrisma.timetable.findMany({
      where: { teacher_id: userId, school_id: schoolId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
    });

    // Distinct classes
    const classMap = new Map<string, { id: string; name: string }>();
    teacherSlots.forEach((s) => classMap.set(s.class.id, s.class));
    const myClasses = Array.from(classMap.values());
    const myClassIds = myClasses.map((c) => c.id);

    const [studentCount, todayAttendance, myAssignments] = await Promise.all([
      basePrisma.student.count({
        where: { school_id: schoolId, class_id: { in: myClassIds }, status: "ACTIVE" },
      }),
      basePrisma.attendance.groupBy({
        by: ["status"],
        where: {
          school_id: schoolId,
          class_id: { in: myClassIds },
          date: new Date(new Date().toISOString().split("T")[0]),
        },
        _count: { status: true },
      }),
      basePrisma.assignment.findMany({
        where: { school_id: schoolId, created_by: userId },
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { due_date: "asc" },
        take: 5,
      }),
    ]);

    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const todayDay = days[new Date().getDay()];
    const todaySlots = teacherSlots.filter((s) => s.day_of_week === todayDay);

    const present = todayAttendance.find((r) => r.status === "PRESENT")?._count.status ?? 0;
    const absent  = todayAttendance.find((r) => r.status === "ABSENT")?._count.status ?? 0;
    const late    = todayAttendance.find((r) => r.status === "LATE")?._count.status ?? 0;
    const totalMarked = present + absent + late;
    const attendanceRate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null;

    return (
      <TeacherDashboard
        userName={userName}
        myClasses={myClasses}
        studentCount={studentCount}
        todaySlots={todaySlots.map((s) => ({
          id: s.id,
          subject: s.subject.name,
          className: s.class.name,
          startTime: s.start_time,
          endTime: s.end_time,
          room: s.room,
        }))}
        attendanceRate={attendanceRate}
        totalMarked={totalMarked}
        assignments={myAssignments.map((a) => ({
          id: a.id,
          title: a.title,
          className: a.class.name,
          subject: a.subject.name,
          dueDate: a.due_date.toISOString(),
          submissions: a._count.submissions,
        }))}
      />
    );
  }

  // --- Admin / Head / Accountant dashboard ---
  const { academic_year, term: termParam } = await searchParams;
  const academicYear = academic_year || "";
  const term = termParam || "";
  const invoiceFilter: any = { school_id: schoolId };
  if (academicYear) invoiceFilter.academic_year = academicYear;
  if (term) invoiceFilter.term = term;

  const [
    totalStudents,
    totalTeachers,
    feesStats,
    todayAttendanceGroups,
    genderBreakdown,
    topStudents,
  ] = await Promise.all([
    basePrisma.student.count({ where: { school_id: schoolId, status: "ACTIVE" } }),
    basePrisma.teacherProfile.count({ where: { school_id: schoolId, status: "ACTIVE" } }),
    basePrisma.invoice.aggregate({
      where: invoiceFilter,
      _sum: { amount_paid: true, balance: true },
    }),
    basePrisma.attendance.groupBy({
      by: ["status"],
      where: {
        school_id: schoolId,
        date: new Date(new Date().toISOString().split("T")[0]),
      },
      _count: { status: true },
    }),
    basePrisma.student.groupBy({
      by: ["gender"],
      where: { school_id: schoolId, status: "ACTIVE" },
      _count: { gender: true },
    }),
    basePrisma.examResult.groupBy({
      by: ["student_id"],
      where: { exam: { school_id: schoolId } },
      _avg: { total: true },
      orderBy: { _avg: { total: "desc" } },
      take: 5,
    }),
  ]);

  const presentCount = todayAttendanceGroups.find(r => r.status === "PRESENT")?._count?.status || 0;
  const absentCount  = todayAttendanceGroups.find(r => r.status === "ABSENT")?._count?.status  || 0;
  const lateCount    = todayAttendanceGroups.find(r => r.status === "LATE")?._count?.status    || 0;
  const totalMarked  = presentCount + absentCount + lateCount;
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount / totalMarked) * 100) * 10) / 10 : 0;

  const studentIds = topStudents.map(s => s.student_id);
  const studentDetails = studentIds.length > 0
    ? await basePrisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, first_name: true, last_name: true },
      })
    : [];
  const nameMap: Record<string, string> = {};
  studentDetails.forEach(s => { nameMap[s.id] = `${s.first_name} ${s.last_name}`; });

  const topStudentsFormatted = topStudents.map(s => ({
    name: nameMap[s.student_id] || "Unknown",
    score: Math.round(Number(s._avg.total) || 0),
  }));

  const genderData = genderBreakdown.map(g => ({
    name: g.gender === "M" ? "Male" : g.gender === "F" ? "Female" : g.gender,
    value: g._count.gender,
  }));

  const feesCollected   = Number(feesStats._sum.amount_paid || 0);
  const feesOutstanding = Number(feesStats._sum.balance || 0);

  return (
    <AdminDashboard
      userName={userName}
      academicYear={academicYear}
      term={term}
      totalStudents={totalStudents}
      totalTeachers={totalTeachers}
      feesCollected={feesCollected}
      feesOutstanding={feesOutstanding}
      attendanceRate={attendanceRate}
      totalMarked={totalMarked}
      genderData={genderData}
      topStudents={topStudentsFormatted}
    />
  );
}
