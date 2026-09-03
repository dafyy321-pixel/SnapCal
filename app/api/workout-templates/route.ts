import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { workoutTemplateSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"

export async function GET() {
  try {
    return successResponse({ templates: wellnessDb.listTemplates() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = parseInput(workoutTemplateSchema, await readJson(request))
    return successResponse({ template: wellnessDb.createTemplate(input) }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
