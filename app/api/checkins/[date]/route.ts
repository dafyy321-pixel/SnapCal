import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { checkinSchema, dateParamSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ date: string }> }

async function dateFrom(context: Context) {
  return parseInput(dateParamSchema, await context.params).date
}

export async function GET(_request: Request, context: Context) {
  try {
    const checkin = wellnessDb.getCheckin(await dateFrom(context))
    if (!checkin) throw new NotFoundError("当日状态记录不存在")
    return successResponse({ checkin })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const input = parseInput(checkinSchema, await readJson(request))
    return successResponse({ checkin: wellnessDb.upsertCheckin(await dateFrom(context), input) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    if (!wellnessDb.deleteCheckin(await dateFrom(context))) throw new NotFoundError("当日状态记录不存在")
    return successResponse({ message: "状态记录已删除" })
  } catch (error) {
    return errorResponse(error)
  }
}
