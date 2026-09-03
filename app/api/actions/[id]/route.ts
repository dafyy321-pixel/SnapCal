import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { actionUpdateSchema, idParamSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = parseInput(idParamSchema, await context.params)
    const input = parseInput(actionUpdateSchema, await readJson(request))
    const actionCard = wellnessDb.updateAction(id, input.status, input.reason || null)
    if (!actionCard) throw new NotFoundError("行动卡不存在")
    return successResponse({ action_card: actionCard })
  } catch (error) {
    return errorResponse(error)
  }
}
