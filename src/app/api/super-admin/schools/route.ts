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

    const schools = await prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: { users: true, students: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Fetch schools error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
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

    // Transaction to create school and its initial admin user
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name,
          email,
          phone,
          address,
          subscription_plan: "FREE_TRIAL",
        },
      });

      const password_hash = await bcrypt.hash(adminPassword, 10);

      const adminUser = await tx.user.create({
        data: {
          school_id: school.id,
          name: adminName,
          email: adminEmail,
          password_hash,
          role: "ADMIN",
        },
      });

      return school;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Create school error:", error);
    if (error.code === 'P2002') {
        return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
        );
    }
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  }
}
