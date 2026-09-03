import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { suggestFoodPairings } from "@/lib/food-assist-service"
import { localDb } from "@/lib/local-db"
import { wellnessDb } from "@/lib/wellness-db"
import { foodAssistConfirmSchema, foodAssistSaveSchema, idParamSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

async function idFrom(context: Context) {
  return parseInput(idParamSchema, await context.params).id
}

export async function GET(_request: Request, context: Context) {
  try {
    const session = wellnessDb.getFoodAssist(await idFrom(context))
    if (!session) throw new NotFoundError("食物助手记录不存在")
    return successResponse({ session })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = await idFrom(context)
    const session = wellnessDb.getFoodAssist(id)
    if (!session) throw new NotFoundError("食物助手记录不存在")
    const body = await readJson(request)
    const saveLink = foodAssistSaveSchema.safeParse(body)
    if (saveLink.success) {
      if (session.status !== "suggested") throw new NotFoundError("食材搭配尚未确认")
      if (!localDb.getMeal(saveLink.data.meal_id)) throw new NotFoundError("餐食记录不存在")
      return successResponse({ session: wellnessDb.updateFoodAssist(id, { status: "saved", meal_id: saveLink.data.meal_id }) })
    }
    const input = parseInput(foodAssistConfirmSchema, body)
    const confirmed = wellnessDb.updateFoodAssist(id, { confirmed_items: input.confirmed_items, status: "confirmed" })!
    const suggestions = await suggestFoodPairings(confirmed, localDb.getProfile())
    return successResponse({ session: wellnessDb.updateFoodAssist(id, {
      primary_suggestion: suggestions.primary,
      alternative_suggestion: suggestions.alternative,
      status: "suggested",
    }) })
  } catch (error) {
    return errorResponse(error)
  }
}
