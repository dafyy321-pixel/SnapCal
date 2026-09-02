import { parseInput, readJson } from "@/lib/api-validation"
import { errorResponse, successResponse, ValidationError } from "@/lib/error-handler"
import { localDb } from "@/lib/local-db"
import { userProfileSchema } from "@/lib/validation-schemas"

export const runtime = "nodejs"

export async function GET() {
  try {
    return successResponse({ profile: localDb.getProfile() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    const updates = parseInput(userProfileSchema, await readJson(request))
    if (Object.keys(updates).length === 0) throw new ValidationError("至少需要一个更新字段")
    return successResponse({
      profile: localDb.updateProfile(updates),
      message: "资料已保存",
    })
  } catch (error) {
    return errorResponse(error)
  }
}
