import { NextRequest } from "next/server"

type Record = { count: number; resetAt: number }
const records = new Map<string, Record>()

function cleanup(now: number) {
  for (const [key, record] of records) {
    if (record.resetAt <= now) records.delete(key)
  }
}

export function rateLimit(options: { windowMs: number; maxRequests: number; message: string }) {
  return function wrap(handler: (request: NextRequest) => Promise<Response>) {
    return async function limited(request: NextRequest): Promise<Response> {
      const now = Date.now()
      cleanup(now)
      const key = "local"
      const record = records.get(key) || { count: 0, resetAt: now + options.windowMs }
      record.count += 1
      records.set(key, record)
      if (record.count > options.maxRequests) {
        const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000))
        return Response.json({
          success: false,
          error: { message: options.message, code: "RATE_LIMITED" },
          timestamp: new Date().toISOString(),
        }, {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        })
      }
      const response = await handler(request)
      response.headers.set("X-RateLimit-Limit", String(options.maxRequests))
      response.headers.set("X-RateLimit-Remaining", String(Math.max(0, options.maxRequests - record.count)))
      return response
    }
  }
}

export const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: "AI 分析次数过多，请1小时后再试",
})
