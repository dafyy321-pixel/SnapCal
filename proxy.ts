import { NextRequest, NextResponse } from "next/server"
import { contentSecurityPolicy } from "@/lib/security-headers"
import { assertContentType, assertWriteOrigin } from "@/lib/request-security"
import { errorResponse } from "@/lib/error-handler"

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    try {
      assertWriteOrigin(request)
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const upload = ["/api/analyze", "/api/food-assist"].includes(request.nextUrl.pathname.replace(/\/$/, ""))
        assertContentType(request, upload ? "multipart/form-data" : "application/json")
      }
    } catch (error) { return errorResponse(error) }
  }
  const policy = contentSecurityPolicy()
  const response = NextResponse.next()
  response.headers.set("Content-Security-Policy", policy)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
}
