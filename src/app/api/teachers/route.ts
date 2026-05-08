import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const teachers = await basePrisma.teacherProfile.findMany({
      where: {
        school_id: schoolId,
        ...(q ? {
          user: {
            name: { contains: q, mode: "insensitive" }
          }
        } : {})
      },
      include: {
        user: { select: { id: true, name: true, email: true, is_active: true } }
      },
      orderBy: { staff_id: "asc" },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("[TEACHERS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();

    const {
      name, email, password,
      staff_id, qualification, subject_specialty,
      salary_amount, phone, address, bank_name, bank_account, ssnit_number,
    } = body;

    if (!name || !email || !password || !staff_id || !salary_amount) {
      return NextResponse.json(
        { error: "Name, email, password, staff ID, and salary are required." },
        { status: 400 }
      );
    }

    const existing = await basePrisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const existingStaff = await basePrisma.teacherProfile.findUnique({ where: { staff_id } });
    if (existingStaff) {
      return NextResponse.json({ error: "Staff ID is already taken." }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await basePrisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          school_id: schoolId,
          name,
          email,
          password_hash,
          role: "TEACHER",
          is_active: true,
        },
      });

      const profile = await tx.teacherProfile.create({
        data: {
          user_id: user.id,
          school_id: schoolId,
          staff_id,
          qualification: qualification || null,
          subject_specialty: subject_specialty || null,
          salary_amount: Number(salary_amount),
          phone: phone || null,
          address: address || null,
          bank_name: bank_name || null,
          bank_account: bank_account || null,
          ssnit_number: ssnit_number || null,
          status: "ACTIVE",
        },
        include: { user: { select: { id: true, name: true, email: true, is_active: true } } },
      });

      return profile;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[TEACHERS_POST]", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}
