import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Use raw SQL to ensure all fields (including new ones) are returned
    let rows: any[];
    if (search) {
      rows = await prisma.$queryRaw`
        SELECT
          s.id, s.name, s.email, s.phone, s.address,
          s.subscription_plan, s.subscription_expires_at, s.is_active,
          s.created_at,
          COUNT(DISTINCT u.id)::int AS user_count,
          COUNT(DISTINCT st.id)::int AS student_count
        FROM schools s
        LEFT JOIN users u ON u.school_id = s.id
        LEFT JOIN students st ON st.school_id = s.id
        WHERE s.name ILIKE ${"%" + search + "%"} OR s.email ILIKE ${"%" + search + "%"}
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
    } else {
      rows = await prisma.$queryRaw`
        SELECT
          s.id, s.name, s.email, s.phone, s.address,
          s.subscription_plan, s.subscription_expires_at, s.is_active,
          s.created_at,
          COUNT(DISTINCT u.id)::int AS user_count,
          COUNT(DISTINCT st.id)::int AS student_count
        FROM schools s
        LEFT JOIN users u ON u.school_id = s.id
        LEFT JOIN students st ON st.school_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
    }

    const schools = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      subscription_plan: row.subscription_plan,
      subscription_expires_at: row.subscription_expires_at,
      is_active: row.is_active,
      created_at: row.created_at,
      _count: {
        users: Number(row.user_count),
        students: Number(row.student_count),
      },
    }));

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Fetch schools error:", error);
    return NextResponse.json({ error: "Failed to fetch schools", detail: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, address, adminName, adminEmail, adminPassword } = body;

    if (!name || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "School name and admin details are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name, email, phone, address, subscription_plan: "FREE_TRIAL" },
      });

      const password_hash = await bcrypt.hash(adminPassword, 10);
      await tx.user.create({
        data: { school_id: school.id, name: adminName, email: adminEmail, password_hash, role: "ADMIN" },
      });

      return school;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Create school error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create school", detail: String(error) }, { status: 500 });
  }
}
