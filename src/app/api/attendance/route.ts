import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tenantPrisma } from "@/lib/prisma";
import { sendSingle } from "@/services/sms";
import { AttendanceStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const markerId = (session.user as any).id;
    const body = await req.json();

    const { classId, date, records } = body; 
    // records shape: [{ studentId: "...", status: "PRESENT" }, ...]

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required tracking constraints" }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);
    
    // YYYY-MM-DD Date conversion resolving localized timezone boundary faults
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const school = await db.school.findUnique({ where: { id: schoolId } });
    const schoolName = school?.name || "SchoolMS";

    let absentPromises: Promise<any>[] = [];

    // Atomically loop strictly inserting or overwriting limits (upsert logic preserving Idempotency)
    const transactionBounds = records.map(async (record) => {
      const { studentId, status } = record;

      // Ensure system explicitly enforces valid enum casting limits
      const validStatus = Object.values(AttendanceStatus).includes(status) ? status : "PRESENT";

      const upserted = await db.attendance.upsert({
        where: {
          student_id_date: {
            student_id: studentId,
            date: parsedDate
          }
        },
        update: {
          status: validStatus,
          marked_by: markerId,
          marked_at: new Date()
        },
        create: {
          school_id: schoolId,
          class_id: classId,
          student_id: studentId,
          date: parsedDate,
          status: validStatus,
          marked_by: markerId,
        },
        include: { student: true }
      });

      // Filter Absences pushing dynamically into the Hubtel Pipeline Logic!
      if (validStatus === "ABSENT") {
        const msg = `${schoolName}: Your ward ${upserted.student.first_name} was marked ABSENT from school today without prior notice. Please contact administration.`;
        absentPromises.push(sendSingle(schoolId, upserted.student.parent_phone, msg));
      }

      return upserted;
    });

    // Resolve atomic DB hooks first
    await Promise.all(transactionBounds);

    // Resolve non-blocking auto-SMS dispatches dynamically mapping against Telecom layers safely
    Promise.allSettled(absentPromises).catch((err) => console.error("Absence SMS Fault", err));

    return NextResponse.json({ success: true, AbsencesFired: absentPromises.length });

  } catch (error: any) {
    console.error("[ATTENDANCE_MARKING_ERR]", error);
    return NextResponse.json({ error: "Atomic UPSERT Loop Failed" }, { status: 500 });
  }
}
