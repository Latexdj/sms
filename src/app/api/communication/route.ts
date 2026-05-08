import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;

    const logs = await basePrisma.smsLog.findMany({
      where: { school_id: schoolId },
      orderBy: { sent_at: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[COMMUNICATION_LOGS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch SMS logs" }, { status: 500 });
  }
}
