/**
 * 统一认证中间件
 * 提供可复用的认证逻辑，避免在各个API路由中重复代码
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AppError } from './error-handler'

/**
 * 当前认证用户信息接口
 */
export interface AuthenticatedUser {
  id: string
  email?: string
  phone?: string
  user_metadata?: Record<string, any>
}

/**
 * 扩展NextRequest接口，添加用户信息
 */
declare global {
  interface NextRequest {
    user?: AuthenticatedUser
  }
}

/**
 * 从请求中提取认证令牌
 * @param request NextRequest对象
 * @returns Bearer token或null
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return null
  }

  // 支持 "Bearer token" 格式
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // 如果没有Bearer前缀，直接返回token
  return authHeader
}

/**
 * 验证用户身份
 * @param request NextRequest对象
 * @returns 认证用户信息
 * @throws AppError 如果认证失败
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser> {
  const token = extractToken(request)

  if (!token) {
    throw new AppError(
      "未提供认证令牌",
      401,
      "MISSING_TOKEN"
    )
  }

  // 创建带超时配置的Supabase客户端
  const createSupabaseWithTimeout = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          fetch: (url, options = {}) => {
            const timeout = 15000 // 15秒超时

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)

            return fetch(url, {
              ...options,
              signal: controller.signal,
            })
            .finally(() => {
              clearTimeout(timeoutId)
            })
            .catch((error) => {
              if (error.name === 'AbortError') {
                throw new Error('认证服务连接超时')
              }
              throw error
            })
          }
        }
      }
    )
  }

  let lastError: Error | null = null

  // 重试机制：最多尝试3次，每次间隔递增
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const supabase = createSupabaseWithTimeout()

      console.log(`[Auth] 认证尝试 ${attempt}/3`)

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error) {
        console.error('[Auth] Supabase auth error (尝试 ' + attempt + '):', error)
        lastError = new Error(error.message)

        // 如果是网络相关错误，可以重试
        if (attempt < 3 && isRetryableError(error)) {
          console.log(`[Auth] 网络错误，${attempt * 500}ms后重试...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 500))
          continue
        }

        throw new AppError(
          "无效的认证令牌",
          401,
          "INVALID_TOKEN"
        )
      }

      if (!user) {
        throw new AppError(
          "用户不存在",
          401,
          "USER_NOT_FOUND"
        )
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        user_metadata: user.user_metadata,
      }

    } catch (error) {
      lastError = error as Error

      // 如果是我们自定义的AppError且不是网络问题，直接抛出
      if (error instanceof AppError && !isRetryableError(error)) {
        throw error
      }

      // 如果是最后一次尝试，或者不是可重试错误，直接抛出
      if (attempt === 3 || !isRetryableError(error as Error)) {
        break
      }

      console.log(`[Auth] 认证失败，${attempt * 500}ms后重试...`)
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
    }
  }

  // 所有重试都失败了
  if (lastError) {
    console.error('[Auth] 所有认证尝试都失败:', lastError)

    if (lastError instanceof AppError) {
      throw lastError
    }

    throw new AppError(
      "认证服务暂时不可用，请检查网络连接后重试",
      503,
      "AUTH_SERVICE_UNAVAILABLE"
    )
  }

  throw new AppError(
    "认证失败",
    500,
    "AUTHENTICATION_FAILED"
  )
}

/**
 * 判断是否为可重试的错误
 * @param error 错误对象
 * @returns 是否可重试
 */
function isRetryableError(error: any): boolean {
  const message = error?.message || error

  if (typeof message === 'string') {
    const msg = message.toLowerCase()
    return (
      msg.includes('fetch failed') ||
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('connect') ||
      msg.includes('econnreset') ||
      msg.includes('connection') ||
      msg.includes('连接') ||
      msg.includes('网络') ||
      msg.includes('超时')
    )
  }

  // 对于Supabase AuthError，检查状态码
  if (error?.__isAuthError && error?.status === 0) {
    return true
  }

  return false
}

/**
 * 认证中间件包装器
 * 用于包装API处理函数，自动处理认证
 * @param handler API处理函数
 * @returns 包装后的处理函数
 */
export function withAuth<T extends NextRequest>(
  handler: (request: T, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: T, ...args: any[]): Promise<NextResponse> => {
    try {
      // 验证用户身份
      const user = await authenticateUser(request)

      // 将用户信息添加到请求对象
      request.user = user

      // 调用原始处理函数
      return await handler(request, ...args)

    } catch (error) {
      // 统一错误处理
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
          { status: error.statusCode }
        )
      }

      // 未知错误
      console.error('[Auth] Unexpected error:', error)
      return NextResponse.json(
        {
          error: "服务器内部错误",
          code: "INTERNAL_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行（用于公开的API）
 * @param handler API处理函数
 * @returns 包装后的处理函数
 */
export function withOptionalAuth<T extends NextRequest>(
  handler: (request: T, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: T, ...args: any[]): Promise<NextResponse> => {
    try {
      const token = extractToken(request)

      if (token) {
        // 如果提供了token，尝试验证
        try {
          const user = await authenticateUser(request)
          request.user = user
        } catch (error) {
          // 可选认证失败时不抛出错误，但记录日志
          console.warn('[Optional Auth] Token validation failed:', error)
        }
      }

      // 继续执行原始处理函数
      return await handler(request, ...args)

    } catch (error) {
      // 只处理认证意外的错误
      console.error('[Optional Auth] Unexpected error:', error)
      return NextResponse.json(
        {
          error: "服务器内部错误",
          code: "INTERNAL_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 验证用户权限（扩展功能，为未来角色系统准备）
 * @param user 认证用户
 * @param requiredPermissions 需要的权限列表
 * @returns 是否有权限
 */
export function hasPermission(
  user: AuthenticatedUser,
  requiredPermissions: string[]
): boolean {
  // 基础实现：所有认证用户都有基础权限
  // 未来可以扩展为基于角色的权限系统
  return true
}

/**
 * 权限检查中间件
 * @param requiredPermissions 需要的权限列表
 * @returns 权限检查中间件
 */
export function withPermissions(requiredPermissions: string[]) {
  return function<T extends NextRequest>(
    handler: (request: T, ...args: any[]) => Promise<NextResponse>
  ) {
    return withAuth(async (request: T, ...args: any[]) => {
      if (!request.user) {
        throw new AppError(
          "用户未认证",
          401,
          "USER_NOT_AUTHENTICATED"
        )
      }

      if (!hasPermission(request.user, requiredPermissions)) {
        throw new AppError(
          "权限不足",
          403,
          "INSUFFICIENT_PERMISSIONS"
        )
      }

      return await handler(request, ...args)
    })
  }
}