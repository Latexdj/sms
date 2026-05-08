"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerSchool(data: {
  schoolName: string;
  adminName: string;
  email: string;
  password: string;
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const school = await prisma.school.create({
      data: {
        name: data.schoolName,
        users: {
          create: {
            name: data.adminName,
            email: data.email,
            password_hash: hashedPassword,
            role: "ADMIN",
          },
        },
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Registration error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
