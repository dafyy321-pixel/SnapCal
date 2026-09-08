import { NextRequest } from "next/server"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { workoutInputSchema, workoutQuerySchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(workoutQuerySchema, Object.fromEntries(request.nextUrl.searchParams))
    const filters = {
      date: query.date,
      startDate: query.start_date,
      endDate: query.end_date,
      status: query.status,
      type: query.type,
    }
    const workouts = wellnessDb.listWorkouts({ ...filters, limit: query.limit, offset: query.offset })
    const total = wellnessDb.countWorkouts(filters)
    return successResponse({
      workouts,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: total > query.offset + query.limit,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = parseInput(workoutInputSchema, await readJson(request))
    return successResponse({ workout: wellnessDb.createWorkout(input) }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
