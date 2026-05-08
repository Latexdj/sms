import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import basePrisma from "@/lib/prisma";

// GET: accounts (with optional type filter) or ledger transactions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "accounts" | "ledger"

    if (type === "ledger") {
      const transactions = await basePrisma.ledgerTransaction.findMany({
        where: { school_id: schoolId },
        include: {
          account: { select: { id: true, name: true, type: true } },
          recorder: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      });
      return NextResponse.json(transactions);
    }

    // Default: accounts with balance summary
    const accounts = await basePrisma.account.findMany({
      where: { school_id: schoolId },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Compute P&L summary
    const income = accounts.filter(a => a.type === "INCOME").reduce((s, a) => s + Number(a.balance), 0);
    const expense = accounts.filter(a => a.type === "EXPENSE").reduce((s, a) => s + Number(a.balance), 0);

    return NextResponse.json({ accounts, summary: { income, expense, net: income - expense } });
  } catch (error) {
    console.error("[ACCOUNTING_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST: Create account OR post journal entry
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const schoolId = (session.user as any).schoolId;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { action } = body;

    if (action === "create_account") {
      const { name, type } = body;
      if (!name || !type) return NextResponse.json({ error: "name and type required" }, { status: 400 });

      const account = await basePrisma.account.create({
        data: { school_id: schoolId, name, type, balance: 0 },
      });
      return NextResponse.json(account);
    }

    // Default: post journal entry
    const { account_id, transaction_type, amount, description, category } = body;
    if (!account_id || !transaction_type || !amount) {
      return NextResponse.json({ error: "account_id, transaction_type, and amount are required" }, { status: 400 });
    }

    const account = await basePrisma.account.findFirst({ where: { id: account_id, school_id: schoolId } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const amountNum = Number(amount);
    const balanceDelta = transaction_type === "CREDIT" ? amountNum : -amountNum;

    const [tx] = await basePrisma.$transaction([
      basePrisma.ledgerTransaction.create({
        data: {
          school_id: schoolId,
          account_id,
          amount: amountNum,
          type: transaction_type as any,
          description: description || null,
          category: category || null,
          recorded_by: userId,
        },
        include: { account: { select: { id: true, name: true, type: true } } },
      }),
      basePrisma.account.update({
        where: { id: account_id },
        data: { balance: { increment: balanceDelta } },
      }),
    ]);

    return NextResponse.json(tx);
  } catch (error) {
    console.error("[ACCOUNTING_POST]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
