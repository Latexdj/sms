import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Default GES-compliant report configuration
const DEFAULT_REPORT_CONFIG = {
  crest_position: "left" as const,
  headteacher_name: "",
  next_term_date: "",
  show_position: true,
  show_grading_scale: true,
  subject_groupings: [
    { name: "Core Subjects", subjects: [] as string[] },
    { name: "Elective Subjects", subjects: [] as string[] },
  ],
  conduct_fields: [
    { label: "Punctuality" },
    { label: "Neatness" },
    { label: "Conduct" },
    { label: "Attitude to Work" },
    { label: "Homework" },
  ],
  signature_fields: [
    { title: "Class Teacher", name: "" },
    { title: "Headteacher", name: "" },
  ],
  grading_scale: [
    { grade: 1, min: 80, max: 100, remark: "Highest" },
    { grade: 2, min: 70, max: 79, remark: "Higher" },
    { grade: 3, min: 65, max: 69, remark: "High" },
    { grade: 4, min: 60, max: 64, remark: "High Average" },
    { grade: 5, min: 55, max: 59, remark: "Average" },
    { grade: 6, min: 50, max: 54, remark: "Low Average" },
    { grade: 7, min: 45, max: 49, remark: "Low" },
    { grade: 8, min: 40, max: 44, remark: "Lower" },
    { grade: 9, min: 0, max: 39, remark: "Lowest" },
  ],
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { report_config: true, name: true, logo: true, motto: true, address: true, district: true, region: true },
    });

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    return NextResponse.json({
      report_config: school.report_config ?? DEFAULT_REPORT_CONFIG,
      school: {
        name: school.name,
        logo: school.logo,
        motto: school.motto,
        address: school.address,
        district: school.district,
        region: school.region,
      },
    });
  } catch (err: any) {
    console.error("[TEMPLATE_GET_ERR]", err);
    return NextResponse.json({ error: "Failed to load template config" }, { status: 500 });
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

    // Merge with defaults so partial saves are safe
    const merged = { ...DEFAULT_REPORT_CONFIG, ...body };

    await prisma.school.update({
      where: { id: schoolId },
      data: { report_config: merged },
    });

    return NextResponse.json({ success: true, report_config: merged });
  } catch (err: any) {
    console.error("[TEMPLATE_PUT_ERR]", err);
    return NextResponse.json({ error: "Failed to save template config" }, { status: 500 });
  }
}
