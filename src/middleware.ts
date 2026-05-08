import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Wrap middleware with next-auth for powerful protect behavior
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Unauthenticated attempts on protected paths are automatically forwarded to /login 
    // by withAuth (with callbackUrl mechanism baked in).
    // If we want role-based validation, we could do it here:
    if (path.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      
      // We could add sophisticated role-to-route protection here.
      // e.g., if (path.startsWith("/dashboard/users") && token.role !== "ADMIN") ...
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Return true if there is a token
    },
  }
);

// Apply middleware strictly to these paths and their sub-paths
export const config = {
  matcher: ["/dashboard/:path*"],
};
