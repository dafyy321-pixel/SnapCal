import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { suggestFoodPairings } from "@/lib/food-assist-service"
import { localDb } from "@/lib/local-db"
import { wellnessDb } from "@/lib/wellness-db"
import { foodAssistConfirmSchema, idParamSchema } from "@/lib/wellness-schemas"

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
    const input = parseInput(foodAssistConfirmSchema, await readJson(request))
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
