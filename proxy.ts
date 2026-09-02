import { NextResponse } from "next/server"
import { contentSecurityPolicy } from "@/lib/security-headers"

export function proxy() {
  const policy = contentSecurityPolicy()
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
