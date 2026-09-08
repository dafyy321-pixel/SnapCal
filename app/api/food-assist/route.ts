import { assertContentType, assertWriteOrigin } from "@/lib/request-security"
import { NextRequest } from "next/server"
import { getAiConfig } from "@/lib/ai-config"
import { parseInput } from "@/lib/api-validation"
import { AppError, errorResponse, successResponse, ValidationError } from "@/lib/error-handler"
import { recognizeFoodInventory } from "@/lib/food-assist-service"
import { DEFAULT_IMAGE_VALIDATION, validateFile } from "@/lib/file-security"
import { deleteImage, saveImage } from "@/lib/local-images"
import { localDb } from "@/lib/local-db"
import { wellnessDb } from "@/lib/wellness-db"
import { foodAssistCreateSchema } from "@/lib/wellness-schemas"
import type { FoodAssistItem } from "@/lib/wellness-types"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    assertWriteOrigin(request)
    assertContentType(request, "multipart/form-data")
    let formData: FormData
    try { formData = await request.formData() } catch { throw new ValidationError("请使用 multipart/form-data 上传图片") }
    const image = formData.get("image")
    if (!(image instanceof File)) throw new ValidationError("请选择图片")
    const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key !== "image"))
    const input = parseInput(foodAssistCreateSchema, fields)
    if (input.workout_id && !wellnessDb.getWorkout(input.workout_id)) throw new ValidationError("关联训练不存在")
    const validation = await validateFile(image, DEFAULT_IMAGE_VALIDATION)
    if (!validation.isValid) throw new ValidationError("图片验证失败", validation.errors)
    const bytes = new Uint8Array(validation.sanitizedContent || await image.arrayBuffer())
    const mock = process.env.USE_MOCK_ANALYSIS === "true" && process.env.NODE_ENV !== "production"
    const config = getAiConfig()
    const profile = localDb.getProfile()
    if (!mock && !config.configured) throw new AppError("AI 服务尚未配置", 503, "AI_NOT_CONFIGURED")
    if (!mock && !profile.ai_consent_at) throw new AppError("请先同意 AI 数据发送说明", 403, "AI_CONSENT_REQUIRED")
    let recognized: { items: FoodAssistItem[]; uncertainties: string[]; ai_run_id: string | null }
    if (mock) {
      recognized = {
        items: [
          { id: crypto.randomUUID(), name: "米饭", confidence: 88, portion_hint: null, nutrition_known: false },
          { id: crypto.randomUUID(), name: "鸡蛋", confidence: 84, portion_hint: null, nutrition_known: false },
        ],
        uncertainties: ["开发测试识别结果"],
        ai_run_id: null,
      }
    } else {
      const base64Url = `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`
      recognized = await recognizeFoodInventory(base64Url, { context: input.context, image_bytes: bytes.length })
    }
    const saved = await saveImage(bytes, image.type)
    try {
      const session = wellnessDb.createFoodAssist({
        context: input.context,
        workout_id: input.workout_id,
        minutes_until_workout: input.minutes_until_workout,
        image_url: saved.url,
        recognized_items: recognized.items,
        uncertainties: recognized.uncertainties,
        ai_run_id: recognized.ai_run_id,
      })
      return successResponse({ session, uncertainties: recognized.uncertainties }, 201)
    } catch (error) {
      await deleteImage(saved.name)
      throw error
    }
  } catch (error) {
    return errorResponse(error)
  }
}
