import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        motto: true,
        logo: true,
        address: true,
        region: true,
        district: true,
        circuit: true,
        phone: true,
        email: true,
        subscription_plan: true,
        sms_credits: true,
        created_at: true,
      },
    });

    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    return NextResponse.json(school);
  } catch (err: any) {
    console.error("[SCHOOL_GET_ERR]", err);
    return NextResponse.json({ error: "Failed to load school profile" }, { status: 500 });
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

    // Only allow safe profile fields — never let callers overwrite id, sms_credits, subscription_plan
    const { name, motto, logo, address, region, district, circuit, phone, email } = body;

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(motto !== undefined && { motto: motto ? String(motto).trim() : null }),
        ...(logo !== undefined && { logo: logo || null }),
        ...(address !== undefined && { address: address ? String(address).trim() : null }),
        ...(region !== undefined && { region: region ? String(region).trim() : null }),
        ...(district !== undefined && { district: district ? String(district).trim() : null }),
        ...(circuit !== undefined && { circuit: circuit ? String(circuit).trim() : null }),
        ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
        ...(email !== undefined && { email: email ? String(email).trim() : null }),
      },
      select: { id: true, name: true, motto: true, logo: true },
    });

    return NextResponse.json({ success: true, school: updated });
  } catch (err: any) {
    console.error("[SCHOOL_PUT_ERR]", err);
    return NextResponse.json({ error: "Failed to update school profile" }, { status: 500 });
  }
}
