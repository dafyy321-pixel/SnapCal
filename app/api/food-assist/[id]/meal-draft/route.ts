import { localDateParts } from "@/lib/date-utils"
import { parseInput, readJson } from "@/lib/api-validation"
import { AppError, errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { idParamSchema, mealDraftSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  try {
    const { id } = parseInput(idParamSchema, await context.params)
    const session = wellnessDb.getFoodAssist(id)
    if (!session) throw new NotFoundError("食物助手记录不存在")
    if (session.status !== "suggested" || !session.confirmed_items.length) throw new AppError("请先确认食材和搭配", 409, "FOOD_ASSIST_NOT_CONFIRMED")
    const input = parseInput(mealDraftSchema, await readJson(request))
    const now = localDateParts()
    const confidence = Math.round(session.confirmed_items.reduce((sum, item) => sum + item.confidence, 0) / session.confirmed_items.length)
    return successResponse({
      draft: {
        meal_name: session.primary_suggestion?.title || session.confirmed_items.map(item => item.name).join("、"),
        meal_type: input.meal_type || "snack",
        meal_date: input.meal_date || now.date,
        meal_time: now.time,
        image_url: session.image_url,
        ingredients: session.confirmed_items.map(item => item.name),
        confidence,
        calories: null,
        protein: null,
        carbs: null,
        fats: null,
        requires_nutrition_confirmation: true,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
