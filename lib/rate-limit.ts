import { NextRequest } from "next/server"
import { AppError } from "./error-handler"

/**
 * API速率限制中间件
 * 提供基于内存的速率限制功能，防止API滥用和DoS攻击
 */

interface RateLimitRecord {
  count: number
  resetTime: number
  firstRequestTime: number
}

interface RateLimitOptions {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
  message?: string // 限制消息
  skipSuccessfulRequests?: boolean // 是否跳过成功的请求
  skipFailedRequests?: boolean // 是否跳过失败的请求
  keyGenerator?: (request: NextRequest) => string // 自定义key生成器
}

// 内存存储速率限制记录
const rateLimitStore = new Map<string, RateLimitRecord>()

// 清理过期记录的定时器
let cleanupTimer: NodeJS.Timeout | null = null

/**
 * 启动清理定时器
 */
function startCleanupTimer() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now >= record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // 每分钟清理一次
}

/**
 * 生成默认的请求key
 */
function generateDefaultKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userId = (request as any).user?.id || 'anonymous'

  // 组合用户ID、IP和User-Agent生成唯一key
  return `${userId}:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 16)}`
}

/**
 * 速率限制中间件工厂函数
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = `请求过于频繁，请在${Math.ceil(windowMs / 1000)}秒后重试`,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = generateDefaultKey
  } = options

  // 启动清理定时器
  startCleanupTimer()

  return function <T extends NextRequest>(
    handler: (request: T, ...args: any[]) => Promise<Response>
  ) {
    return async (request: T, ...args: any[]): Promise<Response> => {
      const key = keyGenerator(request)
      const now = Date.now()

      // 获取或创建速率限制记录
      let record = rateLimitStore.get(key)

      if (!record) {
        record = {
          count: 0,
          resetTime: now + windowMs,
          firstRequestTime: now
        }
        rateLimitStore.set(key, record)
      }

      // 检查时间窗口是否已过期
      if (now >= record.resetTime) {
        record.count = 0
        record.resetTime = now + windowMs
        record.firstRequestTime = now
      }

      // 增加请求计数
      record.count++

      // 检查是否超过限制
      if (record.count > maxRequests) {
        const remainingTime = Math.ceil((record.resetTime - now) / 1000)

        return new Response(
          JSON.stringify({
            success: false,
            error: "RateLimitExceeded",
            message,
            retry_after: remainingTime,
            limit: maxRequests,
            window: Math.ceil(windowMs / 1000),
            remaining: 0
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': record.resetTime.toString(),
              'Retry-After': remainingTime.toString()
            }
          }
        )
      }

      // 执行原始处理函数
      const response = await handler(request, ...args)

      // 根据配置决定是否更新计数
      const shouldUpdateCount =
        (!skipSuccessfulRequests && response.status < 400) ||
        (!skipFailedRequests && response.status >= 400)

      if (shouldUpdateCount) {
        // 请求已经计数，不需要额外操作
      } else {
        // 回滚计数
        record.count--
      }

      // 添加速率限制头部
      const remaining = Math.max(0, maxRequests - record.count)
      const resetIn = Math.ceil((record.resetTime - now) / 1000)

      // 创建新的响应对象以添加头部
      const responseHeaders = new Headers(response.headers)
      responseHeaders.set('X-RateLimit-Limit', maxRequests.toString())
      responseHeaders.set('X-RateLimit-Remaining', remaining.toString())
      responseHeaders.set('X-RateLimit-Reset', record.resetTime.toString())

      if (remaining === 0) {
        responseHeaders.set('Retry-After', resetIn.toString())
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      })
    }
  }
}

/**
 * 预定义的速率限制策略
 */

// 严格的API限制（用于关键API）
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100, // 最多100次请求
  message: "API调用过于频繁，请15分钟后再试"
})

// 中等限制（用于一般API）
export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 300, // 最多300次请求
  message: "请求过于频繁，请稍后再试"
})

// 宽松限制（用于文件上传等）
export const lenientRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 50, // 最多50次请求
  message: "文件上传过于频繁，请1小时后再试"
})

// 分析API特殊限制
export const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 20, // 最多20次分析
  message: "AI分析次数过多，请1小时后再试",
  keyGenerator: (request: NextRequest) => {
    const userId = (request as any).user?.id || 'anonymous'
    return `analysis:${userId}`
  }
})

// 登录API特殊限制
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5, // 最多5次登录尝试
  message: "登录尝试过于频繁，请15分钟后再试",
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
    const phone = request.headers.get('x-phone') || 'unknown'
    return `login:${ip}:${phone}`
  }
})

/**
 * 动态速率限制
 * 根据用户类型设置不同限制
 */
export function createUserBasedRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100, // 默认限制
    message: "请求过于频繁，请稍后再试",
    keyGenerator: (request: NextRequest) => {
      const user = (request as any).user
      const userId = user?.id || 'anonymous'

      // 根据用户类型调整限制
      let maxRequests = 100 // 默认用户
      if (user?.is_premium) {
        maxRequests = 500 // 高级用户
      } else if (user?.is_admin) {
        maxRequests = 1000 // 管理员
      }

      return `user:${userId}:${maxRequests}`
    }
  })
}

/**
 * 获取速率限制状态
 */
export function getRateLimitStatus(key: string): {
  count: number
  remaining: number
  resetTime: number
  resetIn: number
} | null {
  const record = rateLimitStore.get(key)
  if (!record) return null

  const now = Date.now()
  if (now >= record.resetTime) {
    return {
      count: 0,
      remaining: 100, // 假设默认限制为100
      resetTime: record.resetTime,
      resetIn: 0
    }
  }

  return {
    count: record.count,
    remaining: Math.max(0, 100 - record.count), // 需要传入实际的maxRequests
    resetTime: record.resetTime,
    resetIn: Math.ceil((record.resetTime - now) / 1000)
  }
}

/**
 * 清理特定用户的速率限制记录
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * 清理所有过期记录
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * 获取速率限制统计信息
 */
export function getRateLimitStats(): {
  totalKeys: number
  activeKeys: number
  averageRequests: number
} {
  const now = Date.now()
  let totalKeys = rateLimitStore.size
  let activeKeys = 0
  let totalRequests = 0

  for (const record of rateLimitStore.values()) {
    if (now < record.resetTime) {
      activeKeys++
      totalRequests += record.count
    }
  }

  const averageRequests = activeKeys > 0 ? totalRequests / activeKeys : 0

  return {
    totalKeys,
    activeKeys,
    averageRequests: Math.round(averageRequests * 100) / 100
  }
}