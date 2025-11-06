import { NextRequest, NextResponse } from 'next/server'
import { analyzeFoodWithDoubao } from '@/lib/doubao-service'

// 是否使用模拟数据（开发/测试时可以设为 true）
const USE_MOCK = process.env.USE_MOCK_ANALYSIS === 'true'

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: '没有上传图片' }, { status: 400 })
    }

    // Convert image to base64 for analysis
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    console.log(`[Analyze] 开始分析图片，大小: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)

    let analyzedFood

    if (USE_MOCK) {
      // 使用模拟数据（开发/测试）
      console.log('[Analyze] 使用模拟数据')
      analyzedFood = await simulateFoodAnalysis(base64)
    } else {
      // 使用真实的豆包 AI 分析
      console.log('[Analyze] 调用豆包 AI 分析')
      const result = await analyzeFoodWithDoubao(base64)
      
      if (!result.success) {
        console.error('[Analyze] AI 分析失败:', result.error)
        return NextResponse.json(
          { error: result.error || '分析失败，请重试' },
          { status: 500 }
        )
      }

      analyzedFood = result.data
      console.log('[Analyze] AI 分析成功:', analyzedFood?.name)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analyzedFood,
        image: `data:image/jpeg;base64,${base64}`,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Analyze] Error:', error)
    return NextResponse.json(
      { error: '分析失败，请重试' },
      { status: 500 }
    )
  }
}

// Simulate food recognition - replace with actual ML model in production
async function simulateFoodAnalysis(base64: string): Promise<any> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Simple mock: randomly select from database or use default
  const foods = Object.keys(foodDatabase).filter((k) => k !== 'default')
  const randomFood = foods[Math.floor(Math.random() * foods.length)]
  
  return foodDatabase[randomFood] || foodDatabase['default']
}

// You can replace the above with actual API calls to:

/*
// Example: Using Google Cloud Vision API
async function analyzeFoodWithGoogleVision(base64: string) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION' },
            ],
          },
        ],
      }),
    }
  )
  return response.json()
}

// Example: Using custom endpoint (your own ML model server)
async function analyzeFoodWithCustomModel(base64: string) {
  const response = await fetch(`${process.env.ML_MODEL_SERVER}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  })
  return response.json()
}
*/
