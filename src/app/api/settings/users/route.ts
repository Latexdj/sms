import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Staff roles only — parents/students are managed elsewhere
const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "HEADTEACHER", "TEACHER", "ACCOUNTANT", "LIBRARIAN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "HEADTEACHER", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;

    const users = await prisma.user.findMany({
      where: {
        school_id: schoolId,
        role: { in: STAFF_ROLES as any },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[USERS_GET_ERR]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Forbidden — only ADMIN or SUPER_ADMIN can invite staff", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { name, email, password, newRole } = body;

    if (!name || !email || !password || !newRole) {
      return NextResponse.json({ error: "name, email, password, and role are required" }, { status: 400 });
    }

    if (!STAFF_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await prisma.user.findFirst({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        school_id: schoolId,
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        password_hash: hash,
        role: newRole,
        is_active: true,
      },
      select: { id: true, name: true, email: true, role: true, is_active: true, last_login: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("[USERS_POST_ERR]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
