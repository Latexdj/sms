import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Protected boundary executing exclusively inside Vercel's Cron Infrastructure
export async function GET(req: Request) {
  try {
    // Basic verification mapping natively (Vercel attaches a CRON authorization header)
    // For local dev, we parse the boundary naturally ensuring strings are intact
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized Cron Execution Array" }, { status: 401 });
    }

    const today = new Date();

    // 1. Find all active BORROWED metrics specifically exceeding constraints structurally!
    const results = await prisma.bookLoan.updateMany({
       where: {
          status: "BORROWED",
          due_date: {
             lt: today // "less than" mapping limits today structurally accurately checking strict limits!
          }
       },
       data: {
          status: "OVERDUE"
       }
    });

    console.log(`[CRON_LIBRARY] Automated Loop mapped safely updating ${results.count} strings!`);

    return NextResponse.json({ 
       success: true, 
       message: "Overdue Engine Logic Synced natively.",
       records_mutated: results.count
    });

  } catch (error: any) {
    console.error("[CRON_LIBRARY_ERR]", error);
    return NextResponse.json({ error: "Cron Mapping Server Fault" }, { status: 500 });
  }
}
