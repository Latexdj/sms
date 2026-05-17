import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/super-admin/schools/[id]/subscription — Activate or change a school's plan
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, durationMonths } = await req.json();

    const validPlans = ["FREE_TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
    }

    // Fetch current school to get existing expiry — use raw SQL to avoid Prisma cache issues
    const schoolRows: any[] = await prisma.$queryRaw`
      SELECT id, subscription_expires_at FROM schools WHERE id = ${params.id} LIMIT 1
    `;

    if (!schoolRows || schoolRows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Calculate new expiry
    let expiresAt: Date | null = null;
    if (plan !== "FREE_TRIAL" && durationMonths) {
      const now = new Date();
      const existing = schoolRows[0].subscription_expires_at;
      const baseDate = existing && new Date(existing) > now ? new Date(existing) : now;
      expiresAt = new Date(baseDate);
      expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));
    }

    // Use raw SQL update so we don't depend on Prisma client having the new fields
    if (expiresAt) {
      await prisma.$executeRaw`
        UPDATE schools
        SET subscription_plan = ${plan},
            subscription_expires_at = ${expiresAt},
            is_active = true
        WHERE id = ${params.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE schools
        SET subscription_plan = ${plan},
            subscription_expires_at = NULL,
            is_active = true
        WHERE id = ${params.id}
      `;
    }

    return NextResponse.json({
      success: true,
      plan,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("[UPDATE_SUBSCRIPTION]", error);
    return NextResponse.json(
      { error: "Failed to update subscription", detail: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/schools/[id]/subscription — Suspend or reactivate a school
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { is_active } = await req.json();
    const activeVal = Boolean(is_active);

    await prisma.$executeRaw`
      UPDATE schools SET is_active = ${activeVal} WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true, is_active: activeVal });
  } catch (error) {
    console.error("[TOGGLE_SCHOOL]", error);
    return NextResponse.json(
      { error: "Failed to update school status", detail: String(error) },
      { status: 500 }
    );
  }
}
