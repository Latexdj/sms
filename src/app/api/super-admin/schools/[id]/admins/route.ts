import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/super-admin/schools/[id]/admins — Create a new admin for a school
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, role = "ADMIN" } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const school = await prisma.school.findUnique({ where: { id: params.id } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        school_id: params.id,
        name,
        email,
        password_hash,
        role: role as any,
        is_active: true,
      },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists on the platform" }, { status: 400 });
    }
    console.error("[CREATE_ADMIN]", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

// GET /api/super-admin/schools/[id]/admins — List all staff for a school
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { school_id: params.id },
      select: { id: true, name: true, email: true, role: true, is_active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[LIST_ADMINS]", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
