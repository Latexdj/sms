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
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");

    const where: any = { school_id: schoolId };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category && category !== "ALL") where.category = category;
    if (condition && condition !== "ALL") where.condition = condition;

    const assets = await basePrisma.asset.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Summary stats
    const totalValue = assets
      .filter(a => a.condition !== "DISPOSED")
      .reduce((sum, a) => sum + Number(a.purchase_cost) * a.quantity, 0);

    return NextResponse.json({ assets, totalValue });
  } catch (error) {
    console.error("[INVENTORY_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { name, category, quantity, condition, location, purchase_date, purchase_cost, notes } = body;

    if (!name || !category) return NextResponse.json({ error: "name and category required" }, { status: 400 });

    const asset = await basePrisma.asset.create({
      data: {
        school_id: schoolId,
        name,
        category,
        quantity: Number(quantity) || 1,
        condition: condition || "GOOD",
        location: location || null,
        purchase_date: purchase_date ? new Date(purchase_date) : null,
        purchase_cost: Number(purchase_cost) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[INVENTORY_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const body = await req.json();
    const { id, condition } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const asset = await basePrisma.asset.findFirst({ where: { id, school_id: schoolId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const updated = await basePrisma.asset.update({
      where: { id },
      data: { condition: condition as any },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[INVENTORY_PUT]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
