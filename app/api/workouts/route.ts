import { NextRequest } from "next/server"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { workoutInputSchema, workoutQuerySchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(workoutQuerySchema, Object.fromEntries(request.nextUrl.searchParams))
    const workouts = wellnessDb.listWorkouts({
      date: query.date,
      startDate: query.start_date,
      endDate: query.end_date,
      status: query.status,
      type: query.type,
    })
    return successResponse({
      workouts: workouts.slice(query.offset, query.offset + query.limit),
      pagination: {
        total: workouts.length,
        limit: query.limit,
        offset: query.offset,
        has_more: workouts.length > query.offset + query.limit,
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
