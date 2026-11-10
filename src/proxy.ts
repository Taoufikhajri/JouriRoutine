import { NextResponse, type NextRequest } from "next/server";
import { SESSION } from "@/config/app";

/**
 * Optimistic routing only: bounce visitors without a session cookie away from
 * protected areas. Real authorization (role, family ownership) happens on the
 * server in layouts, pages and every server action.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION.cookieName);
  if (!hasSession) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/parent/:path*", "/child/:path*", "/onboarding/:path*"],
};
