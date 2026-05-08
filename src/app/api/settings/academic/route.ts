import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface TermConfig {
  name: string;
  start_date: string;
  end_date: string;
}

export interface AcademicConfig {
  current_academic_year: string;
  current_term: string;
  terms: TermConfig[];
}

const DEFAULT_ACADEMIC_CONFIG: AcademicConfig = {
  current_academic_year: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  current_term: "1st Term",
  terms: [
    { name: "1st Term", start_date: "", end_date: "" },
    { name: "2nd Term", start_date: "", end_date: "" },
    { name: "3rd Term", start_date: "", end_date: "" },
  ],
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { academic_config: true },
    });

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    return NextResponse.json({
      academic_config: school.academic_config ?? DEFAULT_ACADEMIC_CONFIG,
    });
  } catch (err: any) {
    console.error("[ACADEMIC_GET_ERR]", err);
    return NextResponse.json({ error: "Failed to load academic config" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "HEADTEACHER", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();

    const config: AcademicConfig = {
      current_academic_year: body.current_academic_year ?? DEFAULT_ACADEMIC_CONFIG.current_academic_year,
      current_term: body.current_term ?? DEFAULT_ACADEMIC_CONFIG.current_term,
      terms: Array.isArray(body.terms) ? body.terms : DEFAULT_ACADEMIC_CONFIG.terms,
    };

    await prisma.school.update({
      where: { id: schoolId },
      data: { academic_config: config as any },
    });

    return NextResponse.json({ success: true, academic_config: config });
  } catch (err: any) {
    console.error("[ACADEMIC_PUT_ERR]", err);
    return NextResponse.json({ error: "Failed to save academic config" }, { status: 500 });
  }
}
