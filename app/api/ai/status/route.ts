import { getAiConfig } from "@/lib/ai-config"
import { errorResponse, successResponse } from "@/lib/error-handler"
import { localDb } from "@/lib/local-db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const config = getAiConfig()
    return successResponse({
      configured: config.configured,
      provider: config.provider,
      models: { vision: config.visionModel || null, text: config.textModel || null },
      capabilities: { vision: Boolean(config.apiKey && config.visionModel), text: Boolean(config.apiKey && config.textModel) },
      consented: Boolean(localDb.getProfile().ai_consent_at),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
