import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "rd_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API through
  if (pathname.startsWith("/login") || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || token !== expected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
