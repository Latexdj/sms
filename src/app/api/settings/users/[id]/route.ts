import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "ACCOUNTANT", "LIBRARIAN"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const callerRole = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const callerId = (session.user as any).id;
    const { id } = await params;

    if (id === callerId) {
      return NextResponse.json({ error: "You cannot change your own role or status" }, { status: 400 });
    }

    const body = await req.json();
    const { newRole, is_active } = body;

    // Verify target user belongs to this school
    const target = await prisma.user.findFirst({
      where: { id, school_id: schoolId },
      select: { id: true, role: true },
    });

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (newRole !== undefined && !STAFF_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(newRole !== undefined && { role: newRole }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      },
      select: { id: true, name: true, email: true, role: true, is_active: true, last_login: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("[USER_PUT_ERR]", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const callerRole = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(callerRole)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const callerId = (session.user as any).id;
    const { id } = await params;

    if (id === callerId) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    const target = await prisma.user.findFirst({
      where: { id, school_id: schoolId },
    });

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Soft-delete: deactivate rather than hard delete (preserves audit trail)
    await prisma.user.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[USER_DELETE_ERR]", err);
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
