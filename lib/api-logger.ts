import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * API调用日志记录系统
 * 用于安全审计和性能监控
 */

interface ApiLogEntry {
  id: string
  timestamp: string
  method: string
  url: string
  ip_address: string
  user_agent: string
  user_id?: string
  user_type?: 'anonymous' | 'user' | 'premium' | 'admin'
  status_code: number
  response_time: number
  request_size: number
  response_size: number
  error_message?: string
  endpoint: string
  api_version: string
  referer?: string
  country?: string
  city?: string
}

interface LoggingOptions {
  excludeSensitiveData?: boolean
  excludeBody?: boolean
  maxLogSize?: number
  batchInsertSize?: number
}

// 内存缓冲区，用于批量插入
const logBuffer: ApiLogEntry[] = []
let batchTimer: NodeJS.Timeout | null = null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * 创建日志条目
 */
function createLogEntry(
  request: NextRequest,
  response: Response,
  startTime: number,
  options: LoggingOptions = {}
): ApiLogEntry {
  const endTime = Date.now()
  const url = new URL(request.url)

  // 提取用户信息
  const user = (request as any).user
  const userId = user?.id
  const userType = user?.is_admin ? 'admin' : user?.is_premium ? 'premium' : user ? 'user' : 'anonymous'

  // 获取客户端IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown'

  // 获取地理位置信息（如果有）
  const country = request.headers.get('x-vercel-ip-country') || undefined
  const city = request.headers.get('x-vercel-ip-city') || undefined

  // 计算请求和响应大小
  const contentLength = request.headers.get('content-length')
  const requestSize = contentLength ? parseInt(contentLength) : 0

  let responseSize = 0
  if (response.headers) {
    const responseContentLength = response.headers.get('content-length')
    responseSize = responseContentLength ? parseInt(responseContentLength) : 0
  }

  // 提取端点信息
  const endpoint = url.pathname
  const apiVersion = url.searchParams.get('v') || 'v1'

  return {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    method: request.method,
    url: options.excludeSensitiveData ? sanitizeUrl(url.toString()) : url.toString(),
    ip_address: ipAddress,
    user_agent: request.headers.get('user-agent') || 'unknown',
    user_id: userId,
    user_type: userType,
    status_code: response.status,
    response_time: endTime - startTime,
    request_size: requestSize,
    response_size: responseSize,
    endpoint,
    api_version: apiVersion,
    referer: request.headers.get('referer') || undefined,
    country,
    city,
    error_message: response.status >= 400 ? extractErrorMessage(response) : undefined
  }
}

/**
 * 生成日志ID
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * 清理敏感URL信息
 */
function sanitizeUrl(url: string): string {
  const sanitized = new URL(url)
  // 移除敏感查询参数
  sanitized.searchParams.delete('token')
  sanitized.searchParams.delete('password')
  sanitized.searchParams.delete('api_key')
  sanitized.searchParams.delete('secret')
  return sanitized.toString()
}

/**
 * 提取错误信息
 */
function extractErrorMessage(response: Response): string | undefined {
  if (response.status < 400) return undefined

  // 基于状态码的错误描述
  const statusMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Rate Limited',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  }

  return statusMessages[response.status] || 'Unknown Error'
}

/**
 * 批量插入日志到数据库
 */
async function batchInsertLogs(): Promise<void> {
  if (logBuffer.length === 0) return

  try {
    const logsToInsert = [...logBuffer]
    logBuffer.length = 0 // 清空缓冲区

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
      .from('api_logs')
      .insert(logsToInsert)

    if (error) {
      console.error('批量插入API日志失败:', error)
      // 如果批量插入失败，将日志放回缓冲区（最多保留1000条）
      logBuffer.push(...logsToInsert.slice(-1000))
    } else {
      console.log(`成功插入${logsToInsert.length}条API日志`)
    }
  } catch (error) {
    console.error('批量插入API日志异常:', error)
  }
}

/**
 * 启动批量插入定时器
 */
function startBatchTimer(batchSize: number = 100, intervalMs: number = 30000): void {
  if (batchTimer) return

  batchTimer = setInterval(() => {
    if (logBuffer.length >= batchSize) {
      batchInsertLogs()
    }
  }, intervalMs)
}

/**
 * API日志中间件
 */
export function apiLogger(options: LoggingOptions = {}) {
  const {
    excludeSensitiveData = true,
    excludeBody = true,
    maxLogSize = 1000,
    batchInsertSize = 100
  } = options

  // 启动批量插入定时器
  startBatchTimer(batchInsertSize)

  return function <T extends NextRequest>(
    handler: (request: T, ...args: any[]) => Promise<Response>
  ) {
    return async (request: T, ...args: any[]): Promise<Response> => {
      const startTime = Date.now()

      try {
        // 执行原始处理函数
        const response = await handler(request, ...args)

        // 创建日志条目
        const logEntry = createLogEntry(request, response, startTime, options)

        // 检查缓冲区大小
        if (logBuffer.length >= maxLogSize) {
          // 缓冲区满时，立即插入
          await batchInsertLogs()
        }

        // 添加到缓冲区
        logBuffer.push(logEntry)

        return response
      } catch (error) {
        // 记录错误响应
        const errorResponse = new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )

        const logEntry = createLogEntry(request, errorResponse, startTime, options)
        logEntry.error_message = error instanceof Error ? error.message : 'Unknown error'

        logBuffer.push(logEntry)

        throw error
      }
    }
  }
}

/**
 * 记录安全事件
 */
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const securityLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      event_type: eventType,
      details,
      ip_address: request ?
        (request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown') :
        'unknown',
      user_agent: request?.headers.get('user-agent') || 'unknown',
      user_id: (request as any)?.user?.id,
      severity: determineSeverity(eventType)
    }

    const { error } = await supabase
      .from('security_logs')
      .insert(securityLog)

    if (error) {
      console.error('记录安全事件失败:', error)
    }
  } catch (error) {
    console.error('记录安全事件异常:', error)
  }
}

/**
 * 确定事件严重程度
 */
function determineSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = ['sql_injection', 'xss_attempt', 'file_upload_attack']
  const highEvents = ['rate_limit_exceeded', 'authentication_failure', 'authorization_breach']
  const mediumEvents = ['invalid_input', 'suspicious_request', 'large_file_upload']

  if (criticalEvents.includes(eventType)) return 'critical'
  if (highEvents.includes(eventType)) return 'high'
  if (mediumEvents.includes(eventType)) return 'medium'
  return 'low'
}

/**
 * 获取API统计信息
 */
export async function getApiStats(timeframe: string = '24h'): Promise<any> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 计算时间范围
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - parseTimeframe(timeframe))

    const { data, error } = await supabase
      .from('api_logs')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString())

    if (error) throw error

    // 计算统计信息
    const totalRequests = data.length
    const successfulRequests = data.filter(log => log.status_code < 400).length
    const errorRequests = totalRequests - successfulRequests
    const avgResponseTime = data.reduce((sum, log) => sum + log.response_time, 0) / totalRequests

    const endpointStats = data.reduce((acc, log) => {
      if (!acc[log.endpoint]) {
        acc[log.endpoint] = { count: 0, errors: 0, avgResponseTime: 0 }
      }
      acc[log.endpoint].count++
      if (log.status_code >= 400) acc[log.endpoint].errors++
      return acc
    }, {} as Record<string, any>)

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      successRate: (successfulRequests / totalRequests * 100).toFixed(2),
      avgResponseTime: Math.round(avgResponseTime),
      endpointStats,
      timeframe,
      generated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('获取API统计信息失败:', error)
    return null
  }
}

/**
 * 解析时间范围字符串
 */
function parseTimeframe(timeframe: string): number {
  const unit = timeframe.slice(-1)
  const value = parseInt(timeframe.slice(0, -1))

  switch (unit) {
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    case 'w': return value * 7 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000 // 默认24小时
  }
}

/**
 * 强制刷新日志缓冲区
 */
export async function flushLogs(): Promise<void> {
  await batchInsertLogs()
}

/**
 * 获取日志缓冲区状态
 */
export function getLogBufferStatus(): {
  size: number
  maxSize: number
  oldestTimestamp: string | null
} {
  const oldestTimestamp = logBuffer.length > 0 ?
    logBuffer[0].timestamp : null

  return {
    size: logBuffer.length,
    maxSize: 1000,
    oldestTimestamp
  }
}

// 应用关闭时刷新缓冲区
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('正在刷新API日志缓冲区...')
    await flushLogs()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('正在刷新API日志缓冲区...')
    await flushLogs()
    process.exit(0)
  })
}