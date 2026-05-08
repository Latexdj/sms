import { redirect } from "next/navigation";

// Root URL — send unauthenticated visitors to login,
// middleware will redirect authenticated users from /login to /dashboard.
export default function RootPage() {
  redirect("/login");
}
