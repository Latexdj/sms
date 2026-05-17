import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        subscription_plan: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const grouped = schools.reduce((acc, school) => {
      const plan = school.subscription_plan || "FREE_TRIAL";
      if (!acc[plan]) acc[plan] = 0;
      acc[plan]++;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      schools,
      stats: grouped,
    });
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
