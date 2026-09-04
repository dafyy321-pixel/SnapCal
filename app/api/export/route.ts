import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { buildExportFile } from "@/lib/export-service"

export const runtime = "nodejs"

const querySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  range: z.enum(["week", "month", "all"]).default("all"),
  category: z.enum(["meals", "workouts", "checkins", "body_metrics", "experiments"]).default("meals"),
}).strict()

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    return successResponse(buildExportFile(query.format, query.range, query.category))
  } catch (error) {
    return errorResponse(error)
  }
}
