import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/super-admin/schools/[id] — Fetch a single school with full details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw SQL to ensure we get all fields including new ones
    const rows: any[] = await prisma.$queryRaw`
      SELECT
        s.id, s.name, s.motto, s.logo, s.address, s.region, s.district,
        s.circuit, s.phone, s.email,
        s.subscription_plan, s.subscription_expires_at, s.is_active,
        s.created_at,
        COUNT(DISTINCT u.id)::int AS user_count,
        COUNT(DISTINCT st.id)::int AS student_count
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN students st ON st.school_id = s.id
      WHERE s.id = ${params.id}
      GROUP BY s.id
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      motto: row.motto,
      logo: row.logo,
      address: row.address,
      region: row.region,
      district: row.district,
      circuit: row.circuit,
      phone: row.phone,
      email: row.email,
      subscription_plan: row.subscription_plan,
      subscription_expires_at: row.subscription_expires_at,
      is_active: row.is_active,
      created_at: row.created_at,
      _count: {
        users: Number(row.user_count),
        students: Number(row.student_count),
      },
    });
  } catch (error) {
    console.error("[GET_SCHOOL]", error);
    return NextResponse.json({ error: "Failed to fetch school", detail: String(error) }, { status: 500 });
  }
}
