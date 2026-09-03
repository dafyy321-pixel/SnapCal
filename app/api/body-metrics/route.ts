import { NextRequest } from "next/server"
import { parseInput } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { bodyMetricQuerySchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(bodyMetricQuerySchema, Object.fromEntries(request.nextUrl.searchParams))
    const metrics = wellnessDb.listBodyMetrics(query.start_date || "0000-01-01", query.end_date || "9999-12-31")
    return successResponse({ metrics })
  } catch (error) {
    return errorResponse(error)
  }
}
