import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Block rejected users everywhere
    if (token?.status === "REJECTED") {
      return NextResponse.redirect(new URL("/auth/login?error=rejected", req.url));
    }

    // Redirect pending users to a waiting page
    if (token?.status === "PENDING") {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    // Admin UI + Admin API: ADMIN role only
    if (
      (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Nutritionist dashboard: NUTRITIONIST or ADMIN only
    if (
      pathname.startsWith("/dashboard/nutritionist") &&
      token?.role !== "NUTRITIONIST" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard/patient", req.url));
    }

    // Invitation management API: NUTRITIONIST or ADMIN only (POST/DELETE)
    if (
      pathname.startsWith("/api/invitations") &&
      !pathname.startsWith("/api/invitations/accept") &&
      req.method !== "GET" &&
      token?.role !== "NUTRITIONIST" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/invitations/:path*",
  ],
};
