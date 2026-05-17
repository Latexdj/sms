import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar";
import { SuperAdminHeader } from "@/components/layout/super-admin-header";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a1535 100%)" }}
    >
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <SuperAdminHeader
          name={session.user.name || "Super Admin"}
          email={session.user.email || ""}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
