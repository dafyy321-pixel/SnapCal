import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, ValidationError, successResponse } from "@/lib/error-handler"
import { localDb } from "@/lib/local-db"
import { routeParamsSchema, updateMealSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"

type Context = { params: Promise<{ id: string }> }

async function getId(context: Context): Promise<string> {
  return parseInput(routeParamsSchema, await context.params).id
}

export async function GET(_request: Request, context: Context) {
  try {
    const meal = localDb.getMeal(await getId(context))
    if (!meal) throw new NotFoundError("餐食不存在")
    return successResponse({ meal })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    if (!localDb.deleteMeal(await getId(context))) throw new NotFoundError("餐食不存在")
    return successResponse({ message: "删除成功" })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const updates = parseInput(updateMealSchema, await readJson(request))
    if (Object.keys(updates).length === 0) throw new ValidationError("至少需要一个更新字段")
    const meal = localDb.updateMeal(await getId(context), updates)
    if (!meal) throw new NotFoundError("餐食不存在")
    return successResponse({ meal })
  } catch (error) {
    return errorResponse(error)
  }
}
