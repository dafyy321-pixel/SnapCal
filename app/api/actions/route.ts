import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { dateSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"
const querySchema = z.object({ date: dateSchema }).strict()

export async function GET(request: NextRequest) {
  try {
    const { date } = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    return successResponse({ action_card: wellnessDb.getActiveAction(date) })
  } catch (error) {
    return errorResponse(error)
  }
}
