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

    const school = await prisma.school.findUnique({ where: { id: params.id } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Calculate expiry date
    let expiresAt: Date | null = null;
    if (plan !== "FREE_TRIAL" && durationMonths) {
      const now = new Date();
      // If they already have an active subscription that hasn't expired, extend from that date
      const baseDate =
        school.subscription_expires_at && school.subscription_expires_at > now
          ? school.subscription_expires_at
          : now;
      expiresAt = new Date(baseDate);
      expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));
    }

    const updated = await prisma.school.update({
      where: { id: params.id },
      data: {
        subscription_plan: plan,
        subscription_expires_at: expiresAt,
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      plan: updated.subscription_plan,
      expires_at: updated.subscription_expires_at,
    });
  } catch (error) {
    console.error("[UPDATE_SUBSCRIPTION]", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

// PATCH action to suspend or reactivate a school
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

    const updated = await prisma.school.update({
      where: { id: params.id },
      data: { is_active: Boolean(is_active) },
    });

    return NextResponse.json({ success: true, is_active: updated.is_active });
  } catch (error) {
    console.error("[TOGGLE_SCHOOL]", error);
    return NextResponse.json({ error: "Failed to update school status" }, { status: 500 });
  }
}
