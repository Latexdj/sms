import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  } else if (session?.user) {
    redirect("/dashboard");
  }
  
  redirect("/login");
}
