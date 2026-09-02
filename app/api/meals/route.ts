import { NextRequest } from "next/server"
import { z } from "zod"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { localDateParts } from "@/lib/date-utils"
import { localDb, type MealInput } from "@/lib/local-db"
import { createMealSchema, dateSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"

const querySchema = z.object({
  date: dateSchema.optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  search: z.string().trim().max(100).optional(),
  sort_by: z.enum(["meal_date", "meal_time", "created_at", "calories"]).default("meal_time"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const batchSchema = z.object({
  meals: z.array(createMealSchema).min(1).max(10),
}).strict()

function toMealInput(value: z.infer<typeof createMealSchema>): MealInput {
  return {
    ...value,
    meal_time: value.meal_time || localDateParts().time,
    image_url: value.image_url || null,
    ingredients: value.ingredients || [],
    confidence: value.confidence || 0,
    fiber: value.fiber || 0,
    sugar: value.sugar || 0,
    sodium: value.sodium || 0,
    calcium: value.calcium || 0,
    vitamin_c: value.vitamin_c || 0,
    iron: value.iron || 0,
    cholesterol: value.cholesterol || 0,
    saturated_fat: value.saturated_fat || 0,
    trans_fat: value.trans_fat || 0,
    potassium: value.potassium || 0,
    vitamin_a: value.vitamin_a || 0,
    vitamin_d: value.vitamin_d || 0,
    vitamin_e: value.vitamin_e || 0,
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    const result = localDb.listMeals({
      date: query.date,
      mealType: query.meal_type,
      search: query.search,
      sortBy: query.sort_by,
      sortOrder: query.sort_order,
      limit: query.limit,
      offset: query.offset,
    })
    return successResponse({
      profile: localDb.getProfile(),
      meals: result.meals,
      pagination: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: result.total > query.offset + query.limit,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    if (request.nextUrl.searchParams.get("batch") === "true") {
      const parsed = parseInput(batchSchema, body)
      const meals = localDb.createMeals(parsed.meals.map(toMealInput))
      return successResponse({ meals, created_count: meals.length }, 201)
    }
    const meal = localDb.createMeal(toMealInput(parseInput(createMealSchema, body)))
    return successResponse({ meal }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
