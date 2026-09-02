import { DOUBAO_CONFIG, FOOD_ANALYSIS_PROMPT, validateAndProcessFoodData } from './ai-config'

export interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>
}

export interface DoubaoResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用豆包 API 分析食物图片
 * @param imageBase64 图片的 base64 编码（可以带或不带 data:image/xxx;base64, 前缀）
 * @returns 食物营养分析结果
 */
export async function analyzeFoodWithDoubao(imageBase64: string) {
  try {
    // 确保 base64 有正确的前缀
    const base64Data = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`

    // 构建请求消息
    const messages: DoubaoMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: base64Data,
            },
          },
          {
            type: 'text',
            text: FOOD_ANALYSIS_PROMPT,
          },
        ],
      },
    ]

    console.log('[DoubaoService] 开始调用豆包 API...')

    // 校验环境变量
    if (!DOUBAO_CONFIG.apiKey) {
      throw new Error('服务未配置 DOUBAO_API_KEY 环境变量，请在 Vercel 项目中添加该环境变量')
    }

    // 调用豆包 API
    const response = await fetch(DOUBAO_CONFIG.apiUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: DOUBAO_CONFIG.model,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DoubaoService] API 请求失败:', response.status, errorText)
      throw new Error(`豆包 API 请求失败: ${response.status}`)
    }

    const data: DoubaoResponse = await response.json()
    console.log('[DoubaoService] API 响应成功')

    // 提取 AI 返回的内容
    const aiContent = data.choices[0]?.message?.content
    if (!aiContent) {
      throw new Error('AI 未返回有效内容')
    }

    // 解析 JSON（处理可能的 markdown 代码块包裹）
    let foodData
    try {
      // 尝试直接解析
      foodData = JSON.parse(aiContent)
    } catch {
      // 如果失败，尝试提取 JSON（可能被 ```json 包裹）
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[1])
      } else {
        // 最后尝试：查找第一个 { 和最后一个 }
        const firstBrace = aiContent.indexOf('{')
        const lastBrace = aiContent.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonStr = aiContent.substring(firstBrace, lastBrace + 1)
          foodData = JSON.parse(jsonStr)
        } else {
          throw new Error('无法从 AI 响应中提取 JSON')
        }
      }
    }

    // 验证和处理数据
    const validatedData = validateAndProcessFoodData(foodData)

    console.log('[DoubaoService] 分析成功')

    return {
      success: true,
      data: validatedData,
      usage: data.usage,
    }
  } catch (error) {
    console.error('[DoubaoService] 分析失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      data: null,
    }
  }
}

/**
 * 批量分析多个食物（如果图片中有多个菜品）
 */
export async function analyzeFoodBatch(imageBase64List: string[]) {
  const results = await Promise.all(
    imageBase64List.map(img => analyzeFoodWithDoubao(img))
  )
  
  return {
    success: results.every(r => r.success),
    data: results.filter(r => r.success).map(r => r.data),
    errors: results.filter(r => !r.success).map(r => r.error),
  }
}
