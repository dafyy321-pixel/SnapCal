import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { bodyMetricSchema, dateParamSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ date: string }> }

async function dateFrom(context: Context) {
  return parseInput(dateParamSchema, await context.params).date
}

export async function GET(_request: Request, context: Context) {
  try {
    const metric = wellnessDb.getBodyMetric(await dateFrom(context))
    if (!metric) throw new NotFoundError("当日身体指标不存在")
    return successResponse({ metric })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const input = parseInput(bodyMetricSchema, await readJson(request))
    return successResponse({ metric: wellnessDb.upsertBodyMetric(await dateFrom(context), input) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    if (!wellnessDb.deleteBodyMetric(await dateFrom(context))) throw new NotFoundError("当日身体指标不存在")
    return successResponse({ message: "身体指标已删除" })
  } catch (error) {
    return errorResponse(error)
  }
}
