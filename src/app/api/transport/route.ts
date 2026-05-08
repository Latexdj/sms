import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "routes" | "enrollments"

    if (type === "enrollments") {
      const term = searchParams.get("term");
      const enrollments = await basePrisma.transportEnrollment.findMany({
        where: {
          route: { school_id: schoolId },
          ...(term ? { term } : {}),
        },
        include: {
          student: { select: { id: true, first_name: true, last_name: true, admission_number: true } },
          route: { select: { id: true, name: true } },
        },
        orderBy: { student: { first_name: "asc" } },
      });
      return NextResponse.json(enrollments);
    }

    // Default: routes
    const routes = await basePrisma.busRoute.findMany({
      where: { school_id: schoolId },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(routes);
  } catch (error) {
    console.error("[TRANSPORT_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { action } = body;

    if (action === "enroll") {
      const { student_id, route_id, term, amount } = body;
      if (!student_id || !route_id || !term || !amount) {
        return NextResponse.json({ error: "student_id, route_id, term, and amount are required" }, { status: 400 });
      }
      const enrollment = await basePrisma.transportEnrollment.upsert({
        where: { student_id_route_id_term: { student_id, route_id, term } },
        update: { amount },
        create: { student_id, route_id, term, amount, paid: false },
      });
      return NextResponse.json(enrollment);
    }

    // Default: create route
    const { name, vehicle_number, driver_name, driver_phone, pickup_points } = body;
    if (!name || !vehicle_number || !driver_name || !driver_phone) {
      return NextResponse.json({ error: "name, vehicle_number, driver_name, driver_phone are required" }, { status: 400 });
    }

    const route = await basePrisma.busRoute.create({
      data: {
        school_id: schoolId,
        name,
        vehicle_number,
        driver_name,
        driver_phone,
        pickup_points: pickup_points || [],
      },
    });
    return NextResponse.json(route);
  } catch (error) {
    console.error("[TRANSPORT_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
