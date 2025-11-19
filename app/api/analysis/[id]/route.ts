import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { asyncHandler, AppError, NotFoundError } from '@/lib/error-handler'
import { analysisService } from '@/lib/analysis-service'

export const runtime = 'nodejs'

/**
 * 获取分析结果
 * GET /api/analysis/[id]
 */
export const GET = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return await asyncHandler(async () => {
    const { id } = await params
    const userId = request.user!.id

    const analysisResult = await analysisService.getAnalysisResult(id, userId)

    // 返回格式化的数据，兼容前端现有格式
    return {
      id: analysisResult.id,
      name: analysisResult.food_name,
      image: analysisResult.raw_image_url,
      confidence: analysisResult.confidence_score,
      calories: Number(analysisResult.calories),
      protein: Number(analysisResult.protein),
      carbs: Number(analysisResult.carbohydrates),
      fats: Number(analysisResult.fats),
      fiber: analysisResult.fiber ? Number(analysisResult.fiber) : undefined,
      sugar: analysisResult.sugar ? Number(analysisResult.sugar) : undefined,
      sodium: analysisResult.sodium ? Number(analysisResult.sodium) : undefined,
      calcium: analysisResult.calcium ? Number(analysisResult.calcium) : undefined,
      iron: analysisResult.iron ? Number(analysisResult.iron) : undefined,
      cholesterol: analysisResult.cholesterol ? Number(analysisResult.cholesterol) : undefined,
      saturated_fat: analysisResult.saturated_fat ? Number(analysisResult.saturated_fat) : undefined,
      trans_fat: analysisResult.trans_fat ? Number(analysisResult.trans_fat) : undefined,
      potassium: analysisResult.potassium ? Number(analysisResult.potassium) : undefined,
      vitamin_c: analysisResult.vitamin_c ? Number(analysisResult.vitamin_c) : undefined,
      vitamin_a: analysisResult.vitamin_a ? Number(analysisResult.vitamin_a) : undefined,
      vitamin_d: analysisResult.vitamin_d ? Number(analysisResult.vitamin_d) : undefined,
      vitamin_e: analysisResult.vitamin_e ? Number(analysisResult.vitamin_e) : undefined,
      ingredients: analysisResult.ingredients || [],
      portion_multiplier: analysisResult.portion_multiplier || 1.0,
      created_at: analysisResult.created_at,
      updated_at: analysisResult.updated_at,
    }
  })
})

/**
 * 关联分析结果到餐食记录
 * PATCH /api/analysis/[id]
 */
export const PATCH = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return await asyncHandler(async () => {
    const { id } = await params
    const userId = request.user!.id
    const body = await request.json()
    const { meal_id } = body

    if (!meal_id) {
      throw new AppError('缺少餐食记录ID', 400, 'MISSING_MEAL_ID')
    }

    const updatedAnalysis = await analysisService.linkToMeal(id, meal_id, userId)

    return {
      id: updatedAnalysis.id,
      meal_id: updatedAnalysis.meal_id,
      updated_at: updatedAnalysis.updated_at,
    }
  })
})

/**
 * 调整分析结果的份量
 * PUT /api/analysis/[id]
 */
export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  return await asyncHandler(async () => {
    const { id } = await params
    const userId = request.user!.id
    const body = await request.json()
    const { multiplier } = body

    if (typeof multiplier !== 'number' || multiplier < 0.5 || multiplier > 3.0) {
      throw new NotFoundError('份量倍数必须在0.5-3.0之间')
    }

    const updatedAnalysis = await analysisService.adjustPortion(id, userId, multiplier)

    return {
      id: updatedAnalysis.id,
      portion_multiplier: updatedAnalysis.portion_multiplier,
      calories: Number(updatedAnalysis.calories),
      protein: Number(updatedAnalysis.protein),
      carbs: Number(updatedAnalysis.carbohydrates),
      fats: Number(updatedAnalysis.fats),
      fiber: updatedAnalysis.fiber ? Number(updatedAnalysis.fiber) : undefined,
      sugar: updatedAnalysis.sugar ? Number(updatedAnalysis.sugar) : undefined,
      sodium: updatedAnalysis.sodium ? Number(updatedAnalysis.sodium) : undefined,
      calcium: updatedAnalysis.calcium ? Number(updatedAnalysis.calcium) : undefined,
      iron: updatedAnalysis.iron ? Number(updatedAnalysis.iron) : undefined,
      cholesterol: updatedAnalysis.cholesterol ? Number(updatedAnalysis.cholesterol) : undefined,
      saturated_fat: updatedAnalysis.saturated_fat ? Number(updatedAnalysis.saturated_fat) : undefined,
      trans_fat: updatedAnalysis.trans_fat ? Number(updatedAnalysis.trans_fat) : undefined,
      potassium: updatedAnalysis.potassium ? Number(updatedAnalysis.potassium) : undefined,
      vitamin_c: updatedAnalysis.vitamin_c ? Number(updatedAnalysis.vitamin_c) : undefined,
      vitamin_a: updatedAnalysis.vitamin_a ? Number(updatedAnalysis.vitamin_a) : undefined,
      vitamin_d: updatedAnalysis.vitamin_d ? Number(updatedAnalysis.vitamin_d) : undefined,
      vitamin_e: updatedAnalysis.vitamin_e ? Number(updatedAnalysis.vitamin_e) : undefined,
    }
  })
})