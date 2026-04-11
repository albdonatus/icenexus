import { authMiddleware as auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public route
  if (pathname === "/login") {
    if (session?.user) {
      const role = session.user.role as string;
      const redirectTo = role === "SUPERADMIN" ? "/admin" : role === "MANAGER" ? "/manager" : "/technician";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // Not authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role as string;

  // Only SUPERADMIN can access /admin
  if (pathname.startsWith("/admin") && role !== "SUPERADMIN") {
    const redirectTo = role === "MANAGER" ? "/manager" : "/technician";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Manager trying to access technician routes
  if (pathname.startsWith("/technician") && role !== "TECHNICIAN") {
    return NextResponse.redirect(new URL("/manager", req.url));
  }

  // Technician trying to access manager routes
  if (pathname.startsWith("/manager") && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/technician", req.url));
  }

  // /equip/:id and /admin are accessible — allow through
  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/admin/:path*", "/manager/:path*", "/technician/:path*", "/equip/:path*"],
};
