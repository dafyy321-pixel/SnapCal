import { NextRequest } from "next/server"
import { z } from "zod"
import { getAiConfig, validateAndProcessFoodData, type ValidatedFoodAnalysis } from "@/lib/ai-config"
import { analysisService, formatAnalysis } from "@/lib/analysis-service"
import { canReuseAnalysis } from "@/lib/analysis-mode"
import { parseInput } from "@/lib/api-validation"
import { analyzeFoodWithOpenAI } from "@/lib/doubao-service"
import { AppError, errorResponse, successResponse, ValidationError } from "@/lib/error-handler"
import { DEFAULT_IMAGE_VALIDATION, generateSafeFilename, validateFile } from "@/lib/file-security"
import { deleteImage, imageHash, imageNameFromUrl, saveImage } from "@/lib/local-images"
import { localDb } from "@/lib/local-db"
import { analysisRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

const booleanQuery = z.enum(["true", "false"]).transform(value => value === "true").optional()
const querySchema = z.object({
  use_mock: booleanQuery,
  force_reanalyze: booleanQuery,
})

const mockFoods: ValidatedFoodAnalysis[] = [
  validateAndProcessFoodData({ name: "番茄炒蛋", confidence: 91, description: "番茄与鸡蛋快炒", calories: 180, protein: 12.5, carbs: 8.5, fats: 11, ingredients: ["番茄", "鸡蛋", "食用油"], nutrition: { sodium: 450, vitaminC: 18 } }),
  validateAndProcessFoodData({ name: "鸡胸肉沙拉", confidence: 88, description: "烤鸡胸配新鲜蔬菜", calories: 320, protein: 36, carbs: 18, fats: 12, ingredients: ["鸡胸肉", "生菜", "番茄"], nutrition: { fiber: 4.2, sodium: 380 } }),
  validateAndProcessFoodData({ name: "米饭套餐", confidence: 82, description: "米饭配家常菜", calories: 520, protein: 22, carbs: 72, fats: 16, ingredients: ["米饭", "蔬菜", "肉类"], nutrition: { fiber: 3.5, sodium: 720 } }),
]

function mockAnalysis(hash: string): ValidatedFoodAnalysis {
  return mockFoods[Number.parseInt(hash.slice(0, 8), 16) % mockFoods.length]
}

async function handler(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length"))
    const maxRequestSize = (DEFAULT_IMAGE_VALIDATION.maxSize || 5 * 1024 * 1024) + 1024 * 1024
    if (Number.isFinite(contentLength) && contentLength > maxRequestSize) {
      throw new AppError("上传请求过大", 413, "PAYLOAD_TOO_LARGE")
    }
    const abandonedBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const abandonedImages = localDb.pruneUnlinkedAnalyses(abandonedBefore)
    await Promise.all(abandonedImages.flatMap(url => {
      const name = imageNameFromUrl(url)
      return name ? [deleteImage(name)] : []
    }))
    const query = parseInput(querySchema, Object.fromEntries(request.nextUrl.searchParams))
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      throw new ValidationError("请使用 multipart/form-data 上传图片")
    }
    const image = formData.get("image")
    if (!(image instanceof File)) throw new ValidationError("请选择图片")

    const validation = await validateFile(image, DEFAULT_IMAGE_VALIDATION)
    if (!validation.isValid) {
      throw new ValidationError("图片验证失败", validation.errors)
    }
    const bytes = new Uint8Array(validation.sanitizedContent || await image.arrayBuffer())
    const hash = imageHash(bytes)
    const shouldUseMock = process.env.NODE_ENV !== "production" && (process.env.USE_MOCK_ANALYSIS === "true" || query.use_mock === true)
    const aiConfig = getAiConfig()
    if (!shouldUseMock && !aiConfig.configured) throw new AppError("AI 服务尚未配置", 503, "AI_NOT_CONFIGURED")
    if (!shouldUseMock && !localDb.getProfile().ai_consent_at) throw new AppError("请先同意 AI 数据发送说明", 403, "AI_CONSENT_REQUIRED")
    const modelVersion = shouldUseMock ? "local-mock-v1" : aiConfig.visionModel
    const existing = await analysisService.findByHash(hash)
    if (existing && canReuseAnalysis(existing, query.force_reanalyze, modelVersion)) {
      return successResponse({
        analysisId: existing.id,
        data: { ...formatAnalysis(existing), is_cached: true },
        file_warnings: validation.warnings,
      })
    }

    const startedAt = Date.now()
    let analyzed: ValidatedFoodAnalysis
    let rawResponse: unknown
    if (shouldUseMock) {
      analyzed = mockAnalysis(hash)
      rawResponse = { mock: true, data: analyzed }
    } else {
      const base64Url = `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`
      const response = await analyzeFoodWithOpenAI(base64Url)
      if (!response.success || !response.data) {
        throw new AppError(response.error || "AI 分析失败", 502, "AI_ANALYSIS_ERROR")
      }
      analyzed = validateAndProcessFoodData(response.data)
      rawResponse = response
    }

    const savedImage = existing?.raw_image_url
      ? { name: null, url: existing.raw_image_url }
      : await saveImage(bytes, image.type)
    const values = {
      image_hash: hash,
      raw_image_url: savedImage.url,
      raw_analysis_response: rawResponse,
      food_name: analyzed.name,
      confidence_score: analyzed.confidence,
      ingredients: analyzed.ingredients,
      calories: analyzed.calories,
      protein: analyzed.protein,
      carbohydrates: analyzed.carbs,
      fats: analyzed.fats,
      fiber: analyzed.nutrition.fiber || 0,
      sugar: analyzed.nutrition.sugar || 0,
      sodium: analyzed.nutrition.sodium || 0,
      calcium: analyzed.nutrition.calcium || 0,
      iron: analyzed.nutrition.iron || 0,
      cholesterol: analyzed.nutrition.cholesterol || 0,
      saturated_fat: analyzed.nutrition.saturatedFat || 0,
      trans_fat: analyzed.nutrition.transFat || 0,
      potassium: analyzed.nutrition.potassium || 0,
      vitamin_c: analyzed.nutrition.vitaminC || 0,
      vitamin_a: analyzed.nutrition.vitaminA || 0,
      vitamin_d: analyzed.nutrition.vitaminD || 0,
      vitamin_e: analyzed.nutrition.vitaminE || 0,
      portion_multiplier: 1,
      analysis_duration: Date.now() - startedAt,
      api_version: "v1",
      model_version: modelVersion,
      analysis_status: "completed",
      file_metadata: {
        original_name: image.name,
        safe_name: generateSafeFilename(image.name, "food_image"),
        size: image.size,
        type: image.type,
        validation_warnings: validation.warnings,
      },
    }
    let result
    try {
      result = existing
        ? await analysisService.replaceAnalysisResult(existing.id, values)
        : await analysisService.createAnalysisResult(values)
    } catch (error) {
      if (savedImage.name) await deleteImage(savedImage.name)
      throw error
    }

    return successResponse({
      analysisId: result.id,
      data: { ...formatAnalysis(result), description: analyzed.description, analysis_duration: result.analysis_duration },
      file_warnings: validation.warnings,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export const POST = analysisRateLimit(handler)

export { mockAnalysis }
