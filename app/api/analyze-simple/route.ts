import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { analyzeFoodWithDoubao } from '@/lib/doubao-service'

// Mock data
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

function simulateFoodAnalysis(base64: string): any {
  const foods = Object.keys(foodDatabase).filter((k) => k !== 'default')
  const randomFood = foods[Math.floor(Math.random() * foods.length)]
  return foodDatabase[randomFood] || foodDatabase['default']
}

export async function POST(request: NextRequest) {
  console.log('[AnalyzeSimple] 收到分析请求')

  try {
    // 获取Content-Type
    const contentType = request.headers.get('content-type') || ''
    console.log('[AnalyzeSimple] Content-Type:', contentType)

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        createErrorResponse('请使用multipart/form-data格式', 'INVALID_CONTENT_TYPE'),
        { status: 400 }
      )
    }

    // 直接解析FormData
    const formData = await request.formData()
    console.log('[AnalyzeSimple] FormData解析成功')

    const imageFile = formData.get('image') as File
    if (!imageFile) {
      return NextResponse.json(
        createErrorResponse('缺少图片文件', 'MISSING_IMAGE'),
        { status: 400 }
      )
    }

    console.log('[AnalyzeSimple] 文件信息:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    })

    // 文件验证
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        createErrorResponse('文件大小超过5MB限制', 'FILE_TOO_LARGE'),
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        createErrorResponse('不支持的文件类型', 'INVALID_FILE_TYPE'),
        { status: 400 }
      )
    }

    // 转换为base64
    const imageBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    console.log('[AnalyzeSimple] 图片转换base64成功，长度:', base64.length)

    // 检查是否使用模拟数据
    const useMock = process.env.USE_MOCK_ANALYSIS === 'true'
    let analyzedFood

    if (useMock) {
      console.log('[AnalyzeSimple] 使用模拟数据')
      analyzedFood = simulateFoodAnalysis(base64)
    } else {
      console.log('[AnalyzeSimple] 调用真实AI分析')
      const result = await analyzeFoodWithDoubao(base64)
      if (!result.success) {
        return NextResponse.json(
          createErrorResponse(result.error || 'AI分析失败', 'AI_ANALYSIS_ERROR'),
          { status: 500 }
        )
      }
      analyzedFood = result.data
    }

    console.log('[AnalyzeSimple] 分析完成:', analyzedFood.name)

    // 返回结果
    return NextResponse.json(createSuccessResponse({
      analysisId: `simple-${Date.now()}`,
      data: {
        ...analyzedFood,
        image: `data:image/jpeg;base64,${base64}`,
        timestamp: new Date().toISOString(),
        is_cached: false,
      },
    }))

  } catch (error) {
    console.error('[AnalyzeSimple] 处理异常:', error)
    return NextResponse.json(
      createErrorResponse('服务器内部错误', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}