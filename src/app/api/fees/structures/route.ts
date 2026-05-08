import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { class_id, academic_year, name, amount, fee_type } = body;

    if (!class_id || !academic_year || !name || !amount || !fee_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const structure = await basePrisma.feeStructure.create({
      data: {
        school_id: schoolId,
        class_id,
        academic_year,
        name,
        amount,
        fee_type,
      },
      include: { class: { select: { id: true, name: true } } },
    });

    return NextResponse.json(structure);
  } catch (error) {
    console.error("[FEE_STRUCTURES_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const structure = await basePrisma.feeStructure.findFirst({ where: { id, school_id: schoolId } });
    if (!structure) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await basePrisma.feeStructure.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FEE_STRUCTURES_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
