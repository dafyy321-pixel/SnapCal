import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { proposeWeeklyExperiment } from "@/lib/insights-service"
import { wellnessDb } from "@/lib/wellness-db"
import { dateSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"
const querySchema = z.object({ status: z.enum(["proposed", "active", "completed", "skipped", "cancelled"]).optional() }).strict()
const proposalSchema = z.object({ start_date: dateSchema.optional() }).strict()

export async function GET(request: NextRequest) {
  try {
    const { status } = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    const experiments = wellnessDb.listExperiments().filter(item => !status || item.status === status)
    return successResponse({ experiments })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = parseInput(proposalSchema, await readJson(request))
    return successResponse(proposeWeeklyExperiment(input.start_date))
  } catch (error) {
    return errorResponse(error)
  }
}
