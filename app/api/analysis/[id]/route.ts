import { z } from "zod"
import { analysisService, formatAnalysis } from "@/lib/analysis-service"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { routeParamsSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"

type Context = { params: Promise<{ id: string }> }
const linkSchema = z.object({ meal_id: z.string().uuid() }).strict()
const portionSchema = z.object({ multiplier: z.number().min(0.5).max(3).multipleOf(0.1) }).strict()

async function idFrom(context: Context) {
  return parseInput(routeParamsSchema, await context.params).id
}

export async function GET(_request: Request, context: Context) {
  try {
    return successResponse(formatAnalysis(await analysisService.getAnalysisResult(await idFrom(context))))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { meal_id } = parseInput(linkSchema, await readJson(request))
    const result = await analysisService.linkToMeal(await idFrom(context), meal_id)
    return successResponse({ id: result.id, meal_id: result.meal_id, updated_at: result.updated_at })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const { multiplier } = parseInput(portionSchema, await readJson(request))
    return successResponse(formatAnalysis(await analysisService.adjustPortion(await idFrom(context), multiplier)))
  } catch (error) {
    return errorResponse(error)
  }
}
