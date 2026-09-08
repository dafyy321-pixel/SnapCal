import { z, type ZodType } from "zod"
import { createHash } from "node:crypto"
import { getAiConfig } from "./ai-config"
import { AppError } from "./error-handler"
import { wellnessDb } from "./wellness-db"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >
}

export class AiClientError extends AppError {
  constructor(message: string, public code: string, public status?: number) {
    super(message, code === "AI_RATE_LIMITED" || code === "AI_BUSY" ? 429 : 502, code)
    this.name = "AiClientError"
  }
}

const completionSchema = z.object({
  model: z.string().optional(),
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
}).passthrough()

export function extractJson(content: string): unknown {
  try {
    return JSON.parse(content)
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]
    if (fenced) return JSON.parse(fenced)
    const first = content.indexOf("{")
    const last = content.lastIndexOf("}")
    if (first >= 0 && last > first) return JSON.parse(content.slice(first, last + 1))
    throw new AiClientError("AI 未返回有效 JSON", "AI_INVALID_JSON")
  }
}

function safeLog(input: Parameters<typeof wellnessDb.logAiRun>[0]) {
  try {
    return wellnessDb.logAiRun(input)
  } catch (error) {
    console.error("[AI run log failed]", error instanceof Error ? error.message : "unknown")
    return null
  }
}

type CompletionInput<T> = {
  capability: "vision" | "text"
  taskType: string
  promptVersion: string
  messages: ChatMessage[]
  schema: ZodType<T, z.ZodTypeDef, unknown>
  logInput: unknown
  fetchImpl?: typeof fetch
}

type CompletionResult<T> = { data: T; usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined; model: string; runId: string | null }
const shared = globalThis as typeof globalThis & { snapcalAiRequests?: { sentAt: number[]; active: Map<string, Promise<CompletionResult<unknown>>> } }
const requests = shared.snapcalAiRequests ??= { sentAt: [], active: new Map() }

export function createChatCompletion<T>(input: CompletionInput<T>): Promise<CompletionResult<T>> {
  const config = getAiConfig()
  const key = createHash("sha256").update(JSON.stringify([config.endpoint, config.apiKey, config.visionModel, config.textModel, input.taskType, input.promptVersion, input.messages])).digest("hex")
  const existing = requests.active.get(key)
  if (existing) return existing as Promise<CompletionResult<T>>
  if (requests.active.size >= 2) return Promise.reject(new AiClientError("AI 正忙，请稍后重试", "AI_BUSY"))
  const pending = performChatCompletion(input).finally(() => requests.active.delete(key))
  requests.active.set(key, pending)
  return pending
}

async function performChatCompletion<T>(input: CompletionInput<T>): Promise<CompletionResult<T>> {
  const config = getAiConfig()
  const model = input.capability === "vision" ? config.visionModel : config.textModel
  if (!config.apiKey || !model) throw new AiClientError("AI 服务尚未配置", "AI_NOT_CONFIGURED")

  const startedAt = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)
  let status: "completed" | "failed" = "failed"
  let errorCode: string | null = null
  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined
  try {
    let response: Response | null = null
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const now = Date.now()
      requests.sentAt = requests.sentAt.filter(timestamp => timestamp > now - 60 * 60 * 1000)
      if (requests.sentAt.length >= 20) throw new AiClientError("AI 每小时最多发送 20 次请求，请稍后重试", "AI_RATE_LIMITED")
      requests.sentAt.push(now)
      response = await (input.fetchImpl || fetch)(config.endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model, messages: input.messages }),
      })
      if (response.ok) break
      if (!(attempt === 0 && (response.status === 429 || response.status >= 500))) {
        throw new AiClientError(`AI 请求失败 (${response.status})`, "AI_HTTP_ERROR", response.status)
      }
    }
    if (!response?.ok) throw new AiClientError("AI 请求失败", "AI_HTTP_ERROR", response?.status)
    const completion = completionSchema.safeParse(await response.json())
    if (!completion.success) throw new AiClientError("AI 响应结构不正确", "AI_INVALID_RESPONSE")
    usage = completion.data.usage
    const parsed = input.schema.safeParse(extractJson(completion.data.choices[0].message.content))
    if (!parsed.success) throw new AiClientError("AI 返回内容未通过校验", "AI_SCHEMA_ERROR")
    status = "completed"
    const runId = safeLog({
      task_type: input.taskType,
      provider: config.provider,
      model,
      status,
      duration_ms: Date.now() - startedAt,
      input: input.logInput,
      error_code: null,
      prompt_version: input.promptVersion,
      usage,
    })
    return { data: parsed.data, usage, model: completion.data.model || model, runId }
  } catch (error) {
    errorCode = error instanceof AiClientError ? error.code : error instanceof Error && error.name === "AbortError" ? "AI_TIMEOUT" : "AI_REQUEST_ERROR"
    safeLog({
      task_type: input.taskType,
      provider: config.provider,
      model,
      status,
      duration_ms: Date.now() - startedAt,
      input: input.logInput,
      error_code: errorCode,
      prompt_version: input.promptVersion,
      usage,
    })
    if (errorCode === "AI_TIMEOUT") throw new AiClientError("AI 请求超时", errorCode)
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
