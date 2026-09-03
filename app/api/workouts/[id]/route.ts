import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse, ValidationError } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { idParamSchema, workoutPatchSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

async function idFrom(context: Context) {
  return parseInput(idParamSchema, await context.params).id
}

export async function GET(_request: Request, context: Context) {
  try {
    const workout = wellnessDb.getWorkout(await idFrom(context))
    if (!workout) throw new NotFoundError("训练记录不存在")
    return successResponse({ workout })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const updates = parseInput(workoutPatchSchema, await readJson(request))
    if (!Object.keys(updates).length) throw new ValidationError("至少需要一个更新字段")
    const workout = wellnessDb.updateWorkout(await idFrom(context), updates)
    if (!workout) throw new NotFoundError("训练记录不存在")
    return successResponse({ workout })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    if (!wellnessDb.deleteWorkout(await idFrom(context))) throw new NotFoundError("训练记录不存在")
    return successResponse({ message: "训练记录已删除" })
  } catch (error) {
    return errorResponse(error)
  }
}
