import { FOOD_ANALYSIS_PROMPT, foodAnalysisResultSchema } from "./ai-config"
import { createChatCompletion } from "./openai-client"

export async function analyzeFoodWithOpenAI(imageBase64: string) {
  const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
  try {
    const result = await createChatCompletion({
      capability: "vision",
      taskType: "food_analysis",
      promptVersion: "food-v1",
      logInput: { image_bytes: imageUrl.length },
      schema: foodAnalysisResultSchema,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: FOOD_ANALYSIS_PROMPT },
        ],
      }],
    })
    return { success: true as const, data: result.data, usage: result.usage }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "AI 分析失败",
      data: null,
    }
  }
}

/** @deprecated 保留旧名称，实际使用通用 OpenAI 兼容客户端。 */
export const analyzeFoodWithDoubao = analyzeFoodWithOpenAI

export async function analyzeFoodBatch(imageBase64List: string[]) {
  const results = await Promise.all(imageBase64List.map(image => analyzeFoodWithOpenAI(image)))
  return {
    success: results.every(result => result.success),
    data: results.filter(result => result.success).map(result => result.data),
    errors: results.filter(result => !result.success).map(result => result.error),
  }
}
