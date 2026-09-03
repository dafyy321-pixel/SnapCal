import { generateActionCard } from "@/lib/action-engine"
import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { actionGenerateSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const input = parseInput(actionGenerateSchema, await readJson(request))
    return successResponse({ action_card: await generateActionCard(input.date, { force: input.force }) })
  } catch (error) {
    return errorResponse(error)
  }
}
