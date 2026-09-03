import { parseInput, readJson } from "@/lib/api-validation"
import { AppError, errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { buildInsights } from "@/lib/insights-service"
import { wellnessDb } from "@/lib/wellness-db"
import { experimentUpdateSchema, idParamSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = parseInput(idParamSchema, await context.params)
    const current = wellnessDb.getExperiment(id)
    if (!current) throw new NotFoundError("周度尝试不存在")
    const input = parseInput(experimentUpdateSchema, await readJson(request))
    const otherActive = wellnessDb.listExperiments().find(item => item.status === "active" && item.id !== id)
    if (input.status === "active" && otherActive) throw new AppError("已有进行中的周度尝试", 409, "ACTIVE_EXPERIMENT_EXISTS")
    const resultSnapshot = input.status === "completed" ? buildInsights("7d", current.end_date).completeness : undefined
    return successResponse({ experiment: wellnessDb.updateExperiment(id, { ...input, result_snapshot: resultSnapshot }) })
  } catch (error) {
    return errorResponse(error)
  }
}
