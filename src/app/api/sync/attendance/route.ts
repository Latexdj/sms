import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId;
    const userId = (session.user as any).id;

    const { batch } = await req.json();

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      return NextResponse.json({ error: "Invalid payload: batch array required" }, { status: 400 });
    }

    const results = await basePrisma.$transaction(
      batch.map((record: any) =>
        basePrisma.attendance.upsert({
          where: {
            student_id_date: {
              student_id: record.student_id,
              date: new Date(record.date),
            },
          },
          update: {
            status: record.status,
            marked_by: userId,
          },
          create: {
            school_id: schoolId,
            student_id: record.student_id,
            class_id: record.class_id,
            date: new Date(record.date),
            status: record.status,
            marked_by: userId,
          },
        })
      )
    );

    return NextResponse.json({ success: true, synced: results.length });
  } catch (error) {
    console.error("[ATTENDANCE_SYNC_ERR]", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
