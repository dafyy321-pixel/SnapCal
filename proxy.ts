import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const policy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
  const response = NextResponse.next()
  response.headers.set("Content-Security-Policy", policy)
  return response
}

export const config = {
  matcher: [{ source: "/((?!api/images|_next/static|_next/image|favicon.ico|logo.png).*)", missing: [
    { type: "header", key: "next-router-prefetch" },
    { type: "header", key: "purpose", value: "prefetch" },
  ] }],
}
