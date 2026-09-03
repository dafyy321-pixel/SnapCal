import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { buildInsights } from "@/lib/insights-service"

export const runtime = "nodejs"
const querySchema = z.object({ timeframe: z.enum(["7d", "30d"]).default("7d") }).strict()

export async function GET(request: NextRequest) {
  try {
    const { timeframe } = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    return successResponse(buildInsights(timeframe))
  } catch (error) {
    return errorResponse(error)
  }
}
