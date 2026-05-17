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

    const [totalSchools, totalUsers, activeSubscriptions, ledgerTransactions] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.school.count({
        where: {
          subscription_plan: {
            notIn: ["FREE_TRIAL", "CANCELLED", "EXPIRED"],
          },
        },
      }),
      prisma.ledgerTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          type: "CREDIT",
          // Ideally you'd filter by specific accounts representing subscription revenue
        },
      }),
    ]);

    return NextResponse.json({
      totalSchools,
      totalUsers,
      activeSubscriptions,
      totalRevenue: Number(ledgerTransactions._sum.amount || 0),
    });
  } catch (error) {
    console.error("Super admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
