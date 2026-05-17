import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { redirect } from "next/navigation";
import { Role } from "@/components/layout/sidebar";
import OfflineBanner from "@/components/layout/offline-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role as Role;
  
  if (role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  const name = session.user.name ?? "User";
  const email = session.user.email ?? "";

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0">
        <OfflineBanner />
        <Header role={role} name={name} email={email} />
        <main className="flex flex-1 flex-col gap-6 p-5 lg:p-7 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
