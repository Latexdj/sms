import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/super-admin/schools/[id]/reset-password — Reset a user's password
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "User ID and a password of at least 6 characters are required" },
        { status: 400 }
      );
    }

    // Verify the user belongs to this school
    const user = await prisma.user.findFirst({
      where: { id: userId, school_id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in this school" }, { status: 404 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    return NextResponse.json({ success: true, message: `Password reset for ${user.name}` });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
