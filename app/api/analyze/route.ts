import { NextRequest, NextResponse } from 'next/server'
import { analyzeFoodWithDoubao } from '@/lib/doubao-service'
import { withAuth } from '@/lib/auth-middleware'
import { withFileValidation } from '@/lib/validation-middleware'
import { successResponse, errorResponse, AppError } from '@/lib/error-handler'
import { analysisService } from '@/lib/analysis-service'
import { createClient } from '@supabase/supabase-js'
import { validateFile, generateSafeFilename, DEFAULT_IMAGE_VALIDATION } from '@/lib/file-security'
import { z } from 'zod'

// 扩展 NextRequest 类型以包含中间件添加的属性
interface ExtendedNextRequest extends NextRequest {
  user?: any
  validatedQuery?: any
  validatedFiles?: {
    [key: string]: File
  }
}

export const runtime = 'nodejs'

// 是否使用模拟数据（开发/测试时可以设为 true）
const USE_MOCK = process.env.USE_MOCK_ANALYSIS === 'true'

// 分析请求参数验证schema
const analyzeQuerySchema = z.object({
  use_mock: z.coerce.boolean().optional(),
  force_reanalyze: z.coerce.boolean().optional(),
})

// Mock food database for demonstration (仅在 USE_MOCK 为 true 时使用)
const foodDatabase: Record<string, any> = {
  '乌冬面': {
    name: '乌冬面配料',
    confidence: 95,
    calories: 320,
    protein: 18,
    carbs: 40,
    fats: 12,
    ingredients: ['乌冬面', '鸡蛋', '蔬菜', '酱油', '芝麻油'],
    nutrition: {
      fiber: 3,
      sugar: 2,
      sodium: 450,
    },
  },
  '鸡胸肉': {
    name: '烤鸡胸肉',
    confidence: 92,
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    ingredients: ['鸡胸肉', '盐', '黑胡椒'],
    nutrition: {
      sodium: 75,
    },
  },
  '沙拉': {
    name: '蔬菜沙拉',
    confidence: 88,
    calories: 150,
    protein: 5,
    carbs: 12,
    fats: 8,
    ingredients: ['生菜', '番茄', '黄瓜', '橄榄油', '醋'],
    nutrition: {
      fiber: 3,
      sugar: 2,
      sodium: 120,
    },
  },
  '米饭': {
    name: '白米饭',
    confidence: 94,
    calories: 206,
    protein: 4.3,
    carbs: 45,
    fats: 0.3,
    ingredients: ['白米'],
    nutrition: {
      fiber: 0.4,
      sodium: 4,
    },
  },
  'default': {
    name: '未知食物',
    confidence: 45,
    calories: 200,
    protein: 10,
    carbs: 25,
    fats: 8,
    ingredients: ['未识别的食材'],
    nutrition: {
      fiber: 2,
      sugar: 3,
      sodium: 200,
    },
  },
}

// 食物分析处理函数
async function analyzeFoodHandler(request: ExtendedNextRequest): Promise<NextResponse> {
  try {
    const user = request.user!
    const { use_mock, force_reanalyze } = request.validatedQuery || {}
    const imageFile = request.validatedFiles!.image

    // 使用查询参数中的use_mock或环境变量
    const shouldUseMock = use_mock ?? USE_MOCK

    console.log(`[Analyze] 开始分析图片，用户: ${user.id}, 文件: ${imageFile.name}, 大小: ${(imageFile.size / 1024).toFixed(2)} KB`)

    const startTime = Date.now()

    // 文件安全验证
    const fileValidation = await validateFile(imageFile, DEFAULT_IMAGE_VALIDATION)
    if (!fileValidation.isValid) {
      return errorResponse(new AppError("文件验证失败", 400, 'VALIDATION_ERROR', {
          errors: fileValidation.errors,
          warnings: fileValidation.warnings
        }))
    }

    // 如果文件被清理过，使用清理后的数据
    let imageBuffer = await imageFile.arrayBuffer()
    if (fileValidation.sanitizedContent) {
      imageBuffer = fileValidation.sanitizedContent
      console.log('[Analyze] 文件已进行安全处理')
    }

    // 生成安全的文件名
    const safeFilename = generateSafeFilename(imageFile.name, 'food_image')

    // 转换为base64用于分析
    const base64 = Buffer.from(imageBuffer).toString('base64')

    // 为当前图片生成 hash，用于去重和持久化
    const imageHash = generateImageHash(base64)

    let analyzedFood
    let rawResponse

    if (shouldUseMock) {
      // 使用模拟数据（开发/测试）
      console.log('[Analyze] 使用模拟数据')
      analyzedFood = await simulateFoodAnalysis(base64)
      rawResponse = { mock: true, data: analyzedFood }
    } else {
      // 检查是否需要强制重新分析（避免重复分析相同图片）
      if (!force_reanalyze) {
        const existingAnalysis = await findExistingAnalysis(user.id, base64)
        if (existingAnalysis) {
          console.log('[Analyze] 找到现有分析结果，复用数据')
          return successResponse({
            analysisId: existingAnalysis.id,
            data: {
              ...existingAnalysis.food_data,
              image: `data:image/jpeg;base64,${base64}`,
              timestamp: existingAnalysis.created_at,
              is_cached: true,
            },
          })
        }
      }

      // 使用真实的豆包 AI 分析
      console.log('[Analyze] 调用豆包 AI 分析')
      const result = await analyzeFoodWithDoubao(base64)

      if (!result.success) {
        console.error('[Analyze] AI 分析失败:', result.error)
        return errorResponse(new AppError(result.error || '分析失败，请重试', 500, 'AI_ANALYSIS_ERROR', {
          details: fileValidation.warnings
        }))
      }

      analyzedFood = result.data
      rawResponse = result
      console.log('[Analyze] AI 分析成功:', analyzedFood?.name)
    }

    const analysisDuration = Date.now() - startTime

    // 保存分析结果到数据库
    const analysisResult = await analysisService.createAnalysisResult({
      user_id: user.id,
      // 持久化图片 hash，便于去重查询（对应 meal_analysis_results.image_hash 字段）
      image_hash: imageHash,
      raw_image_url: `data:image/jpeg;base64,${base64}`,
      raw_analysis_response: rawResponse,
      food_name: analyzedFood.name,
      confidence_score: analyzedFood.confidence,
      ingredients: analyzedFood.ingredients || [],
      calories: analyzedFood.calories,
      protein: analyzedFood.protein,
      carbohydrates: analyzedFood.carbs || analyzedFood.carbohydrates,
      fats: analyzedFood.fats,
      fiber: analyzedFood.nutrition?.fiber,
      sugar: analyzedFood.nutrition?.sugar,
      sodium: analyzedFood.nutrition?.sodium,
      calcium: analyzedFood.nutrition?.calcium,
      iron: analyzedFood.nutrition?.iron,
      cholesterol: analyzedFood.nutrition?.cholesterol,
      saturated_fat: analyzedFood.nutrition?.saturatedFat,
      trans_fat: analyzedFood.nutrition?.transFat,
      potassium: analyzedFood.nutrition?.potassium,
      vitamin_c: analyzedFood.nutrition?.vitaminC,
      vitamin_a: analyzedFood.nutrition?.vitaminA,
      vitamin_d: analyzedFood.nutrition?.vitaminD,
      vitamin_e: analyzedFood.nutrition?.vitaminE,
      portion_multiplier: 1.0,
      analysis_duration: analysisDuration,
      api_version: 'v1',
      model_version: 'doubao-seed-1-6-flash-250828',
      analysis_status: 'completed',
      file_metadata: {
        original_name: imageFile.name,
        safe_name: safeFilename,
        size: imageFile.size,
        type: imageFile.type,
        validation_warnings: fileValidation.warnings
      }
    })

    console.log(`[Analyze] 分析结果已保存，ID: ${analysisResult.id}`)

    return successResponse({
      analysisId: analysisResult.id,
      data: {
        ...analyzedFood,
        image: `data:image/jpeg;base64,${base64}`,
        timestamp: new Date().toISOString(),
        analysis_duration: analysisDuration,
      },
      file_warnings: fileValidation.warnings,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// 查找现有分析结果（避免重复分析）
async function findExistingAnalysis(userId: string, imageBase64: string) {
  try {
    // 生成图片的哈希值用于比较
    const imageHash = generateImageHash(imageBase64)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('meal_analysis_results')
      .select('*')
      .eq('user_id', userId)
      .eq('image_hash', imageHash)
      .eq('analysis_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return data
  } catch (error) {
    // 没有找到现有记录，返回null
    return null
  }
}

// 生成图片哈希值（简单实现）
function generateImageHash(imageBase64: string): string {
  // 使用前100个字符生成简单哈希
  // 生产环境中应该使用更robust的哈希算法
  const sample = imageBase64.substring(0, 100)
  let hash = 0
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return hash.toString(36)
}

// 模拟食物识别 - 生产环境中替换为实际的ML模型
async function simulateFoodAnalysis(base64: string): Promise<any> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 简单的模拟：从数据库中随机选择
  const foods = Object.keys(foodDatabase).filter((k) => k !== 'default')
  const randomFood = foods[Math.floor(Math.random() * foods.length)]

  return foodDatabase[randomFood] || foodDatabase['default']
}

// 🔒 使用认证和文件验证中间件包装API
export const POST = withAuth(
  withFileValidation({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 1,
    requiredFields: ['image'],
  })(analyzeFoodHandler) as any
) as any

// 导出用于测试的函数
export { simulateFoodAnalysis, generateImageHash }