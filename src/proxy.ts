import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/outlet",
  "/laporan",
  "/laporan-outlet",
  "/settings",
  "/overview",
  "/orders",
  "/menu",
  "/qr-table",
  "/pos",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/outlet/:path*",
    "/laporan/:path*",
    "/laporan-outlet/:path*",
    "/settings/:path*",
    "/overview/:path*",
    "/orders/:path*",
    "/menu/:path*",
    "/qr-table/:path*",
    "/pos/:path*",
  ],
};
