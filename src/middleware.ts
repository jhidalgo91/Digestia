import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protected routes: redirect unauthenticated or rejected users
    if (token?.status === "REJECTED") {
      return NextResponse.redirect(new URL("/auth/login?error=rejected", req.url));
    }

    if (token?.status === "PENDING") {
      return NextResponse.redirect(new URL("/auth/pending", req.url));
    }

    // Admin routes: only ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Require a token for all matched routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
