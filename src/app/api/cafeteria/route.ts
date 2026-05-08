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
    const type = searchParams.get("type"); // "items" | "wallet"
    const admissionNumber = searchParams.get("admission_number");

    if (type === "wallet" && admissionNumber) {
      const student = await basePrisma.student.findFirst({
        where: { school_id: schoolId, admission_number: admissionNumber.toUpperCase() },
      });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

      const wallet = await basePrisma.studentWallet.findUnique({
        where: { student_id: student.id },
      });

      return NextResponse.json({
        student: { id: student.id, name: `${student.first_name} ${student.last_name}`, admission_number: student.admission_number },
        wallet: wallet || { balance: 0 },
      });
    }

    // Default: menu items
    const items = await basePrisma.cafeteriaItem.findMany({
      where: { school_id: schoolId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CAFETERIA_GET]", error);
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

    if (action === "create_item") {
      const { name, unit_price, stock_quantity } = body;
      if (!name || !unit_price) return NextResponse.json({ error: "name and unit_price required" }, { status: 400 });
      const item = await basePrisma.cafeteriaItem.create({
        data: { school_id: schoolId, name, unit_price, stock_quantity: stock_quantity || 0 },
      });
      return NextResponse.json(item);
    }

    if (action === "checkout") {
      const { student_id, cart_items, payment_method } = body;
      // cart_items: [{ id, name, price, qty }]
      if (!student_id || !cart_items?.length || !payment_method) {
        return NextResponse.json({ error: "student_id, cart_items, and payment_method required" }, { status: 400 });
      }

      const total = cart_items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.qty)), 0);

      if (payment_method === "WALLET") {
        const wallet = await basePrisma.studentWallet.findUnique({ where: { student_id } });
        if (!wallet || Number(wallet.balance) < total) {
          return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
        }
        await basePrisma.studentWallet.update({
          where: { student_id },
          data: { balance: { decrement: total } },
        });
      }

      // Decrement stock for each item
      for (const item of cart_items) {
        await basePrisma.cafeteriaItem.update({
          where: { id: item.id },
          data: { stock_quantity: { decrement: Number(item.qty) } },
        }).catch(() => {}); // ignore if item not found
      }

      const tx = await basePrisma.cafeteriaTransaction.create({
        data: {
          school_id: schoolId,
          student_id,
          items: cart_items,
          total,
          payment_method: payment_method as any,
        },
      });

      return NextResponse.json({ success: true, transaction: tx, total });
    }

    if (action === "topup") {
      const { student_id, amount } = body;
      if (!student_id || !amount) return NextResponse.json({ error: "student_id and amount required" }, { status: 400 });

      const wallet = await basePrisma.studentWallet.upsert({
        where: { student_id },
        update: { balance: { increment: Number(amount) } },
        create: { student_id, school_id: schoolId, balance: Number(amount) },
      });

      return NextResponse.json(wallet);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[CAFETERIA_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
