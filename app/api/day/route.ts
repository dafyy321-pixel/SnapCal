import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { localDb } from "@/lib/local-db"
import { wellnessDb } from "@/lib/wellness-db"
import { dateSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"
const querySchema = z.object({ date: dateSchema }).strict()

export async function GET(request: NextRequest) {
  try {
    const { date } = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    const meals = localDb.listMeals({ date }).meals
    const workouts = wellnessDb.listWorkouts({ date })
    const nutrition = meals.reduce((sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fats: sum.fats + meal.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
    return successResponse({
      date,
      meals,
      workouts,
      checkin: wellnessDb.getCheckin(date),
      body_metric: wellnessDb.getBodyMetric(date),
      action_card: wellnessDb.getActiveAction(date),
      summary: {
        nutrition,
        meal_count: meals.length,
        workout_count: workouts.length,
        completed_workout_count: workouts.filter(workout => workout.status === "completed").length,
        workout_minutes: workouts.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
