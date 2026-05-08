import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PLAN_DETAILS: Record<string, { label: string; sms_quota: number; features: string[] }> = {
  FREE_TRIAL: {
    label: "Free Trial",
    sms_quota: 1_000,
    features: [
      "Up to 200 students",
      "1,000 SMS credits",
      "Core modules (attendance, fees, exams)",
      "1 admin account",
    ],
  },
  BASIC: {
    label: "Basic",
    sms_quota: 5_000,
    features: [
      "Up to 500 students",
      "5,000 SMS credits / term",
      "All core modules",
      "5 staff accounts",
      "Email support",
    ],
  },
  PREMIUM: {
    label: "Premium",
    sms_quota: 20_000,
    features: [
      "Unlimited students",
      "20,000 SMS credits / term",
      "All modules including Cafeteria & Library",
      "Unlimited staff accounts",
      "Priority support",
      "Custom report templates",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    sms_quota: 100_000,
    features: [
      "Unlimited students",
      "100,000 SMS credits / term",
      "All Premium features",
      "Dedicated account manager",
      "API access",
      "On-premise deployment option",
    ],
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "HEADTEACHER", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        subscription_plan: true,
        sms_credits: true,
        created_at: true,
        _count: { select: { students: true, users: true } },
      },
    });

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    const planKey = school.subscription_plan ?? "FREE_TRIAL";
    const planInfo = PLAN_DETAILS[planKey] ?? PLAN_DETAILS["FREE_TRIAL"];

    return NextResponse.json({
      plan_key: planKey,
      plan: planInfo,
      sms_credits: school.sms_credits,
      student_count: school._count.students,
      staff_count: school._count.users,
      created_at: school.created_at,
    });
  } catch (err: any) {
    console.error("[BILLING_GET_ERR]", err);
    return NextResponse.json({ error: "Failed to load billing info" }, { status: 500 });
  }
}
