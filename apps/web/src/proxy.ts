import { NextResponse, type NextRequest } from "next/server";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth-session";

export function proxy(request: NextRequest) {
  const hasWalletSession = Boolean(request.cookies.get(WALLET_SESSION_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasWalletSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && hasWalletSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
