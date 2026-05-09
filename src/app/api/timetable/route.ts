import { NextResponse } from "next/server";
import { tenantPrisma } from "@/lib/prisma";
import basePrisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const teacherId = searchParams.get("teacher_id");

    const where: any = { school_id: schoolId };
    if (classId) where.class_id = classId;
    // For teachers, return only their own timetable
    if (role === "TEACHER") where.teacher_id = userId;
    else if (teacherId) where.teacher_id = teacherId;

    const slots = await basePrisma.timetable.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("[TIMETABLE_GET]", error);
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}

// Time string parsing resolving explicit integer limits (e.g. "08:30" => 8.5)
const timeToFloat = (timeStr: string) => {
   const [hours, minutes] = timeStr.split(":").map(Number);
   return hours + (minutes / 60);
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();

    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body;

    if (!classId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing explicit scheduling limits mapping structurally." }, { status: 400 });
    }

    const tStart = timeToFloat(startTime);
    const tEnd = timeToFloat(endTime);

    if (tStart >= tEnd) {
      return NextResponse.json({ error: "Start time must explicitly precede ending limits natively." }, { status: 400 });
    }

    const db = tenantPrisma(schoolId);

    // 1. Conflict Check: Teacher double booking engine
    // We grab all active teacher bounds for this specific specific day
    const teacherSchedule = await db.timetable.findMany({
      where: {
        teacher_id: teacherId,
        day_of_week: dayOfWeek as DayOfWeek
      }
    });

    const hasConflict = teacherSchedule.some(slot => {
       const existingStart = timeToFloat(slot.start_time);
       const existingEnd = timeToFloat(slot.end_time);
       
       // Standard temporal overlap logic bounding array vectors
       // A intersects B mapping logic natively: (StartA < EndB) && (EndA > StartB)
       return (tStart < existingEnd) && (tEnd > existingStart);
    });

    if (hasConflict) {
      return NextResponse.json({ 
        error: "CRITICAL: The selected Teacher is already explicitly booked during this temporal boundary." 
      }, { status: 409 });
    }

    // 2. Class double booking engine
    const classSchedule = await db.timetable.findMany({
      where: {
        class_id: classId,
        day_of_week: dayOfWeek as DayOfWeek
      }
    });

    const hasClassConflict = classSchedule.some(slot => {
       const existingStart = timeToFloat(slot.start_time);
       const existingEnd = timeToFloat(slot.end_time);
       return (tStart < existingEnd) && (tEnd > existingStart);
    });

    if (hasClassConflict) {
      return NextResponse.json({ 
         error: "CRITICAL: This Class already has another mapping exactly overlapping this temporal boundary." 
      }, { status: 409 });
    }

    // 3. Native Execution inserting the record correctly
    const newSlot = await db.timetable.create({
      data: {
        school_id: schoolId,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherId,
        day_of_week: dayOfWeek as DayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room: room || null
      }
    });

    return NextResponse.json({ success: true, record: newSlot });

  } catch (error: any) {
    console.error("[TIMETABLE_ALLOCATION_ERR]", error);
    return NextResponse.json({ error: "Booking Server Sync Loop Failed" }, { status: 500 });
  }
}
