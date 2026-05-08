import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tenantPrisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // Validate the user possesses administrative abilities for this action
    if (!["SUPER_ADMIN", "ADMIN", "HEADTEACHER"].includes((session.user as any).role)) {
       return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const db = tenantPrisma(schoolId);
    
    const body = await req.json();
    const { studentIds, targetClassId } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetClassId) {
      return NextResponse.json({ error: "Invalid payload parameters." }, { status: 400 });
    }

    // Execute bulk update using `updateMany` scoped cleanly by `tenantPrisma` layer
    const result = await db.student.updateMany({
      where: { id: { in: studentIds } },
      data: { class_id: targetClassId },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `Successfully promoted ${result.count} students.`
    });

  } catch (error) {
    console.error("[STUDENTS_PROMOTE_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
