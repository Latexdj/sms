import { NextResponse } from "next/server";
import basePrisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await basePrisma.user.findMany();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
