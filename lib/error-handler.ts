/**
 * 统一错误处理系统
 * 提供标准化的错误类型、格式和处理机制
 */

import { NextResponse } from 'next/server'

/**
 * 应用程序错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'UNKNOWN_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'

    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * 冲突错误类
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * 业务逻辑错误类
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(message, 422, code)
    this.name = 'BusinessError'
  }
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

/**
 * 成功响应
 * @param data 响应数据
 * @param statusCode HTTP状态码
 * @returns NextResponse
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}

/**
 * 错误响应
 * @param error 错误对象
 * @returns NextResponse
 */
export function errorResponse(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && error.details && {
            details: error.details,
          }),
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    )
  }

  // 处理Supabase错误
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as any
    console.error('[Supabase Error]', supabaseError)

    // Supabase常见错误映射
    const errorCode = supabaseError.code || 'SUPABASE_ERROR'
    let message = supabaseError.message || '数据库操作失败'
    let statusCode = 500

    switch (errorCode) {
      case 'PGRST116': // 资源未找到
        message = '请求的资源未找到'
        statusCode = 404
        break
      case 'PGRST301': // 权限不足
        message = '权限不足'
        statusCode = 403
        break
      case '23505': // 唯一约束冲突
        message = '数据已存在，请勿重复提交'
        statusCode = 409
        break
      case '23503': // 外键约束冲突
        message = '关联数据不存在'
        statusCode = 400
        break
      case 'PGRST204': // 无内容返回
        message = '操作成功，但无内容返回'
        statusCode = 200
        break
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: errorCode,
          ...(process.env.NODE_ENV === 'development' && {
            details: supabaseError,
          }),
        },
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    )
  }

  // 处理Zod验证错误
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any
    console.error('[Validation Error]', zodError)

    return NextResponse.json(
      {
        success: false,
        error: {
          message: '请求数据格式不正确',
          code: 'VALIDATION_ERROR',
          details: zodError.issues?.map((issue: any) => ({
            field: issue.path?.join('.'),
            message: issue.message,
          })),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  // 未知错误
  console.error('[Unknown Error]', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.stack : error,
        }),
      },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

/**
 * 异步操作包装器
 * 自动处理try-catch和错误响应
 * @param operation 异步操作函数
 * @returns 操作结果或错误响应
 */
export async function asyncHandler<T>(
  operation: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation()
    return successResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * 创建API路由包装器
 * 为API处理函数提供统一的错误处理
 * @param handler API处理函数
 * @returns 包装后的处理函数
 */
export function withErrorHandler(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

/**
 * 日志记录工具
 */
export class Logger {
  private static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}`

    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  static info(message: string, data?: any) {
    this.log('INFO', message, data)
  }

  static warn(message: string, data?: any) {
    this.log('WARN', message, data)
  }

  static error(message: string, error?: any) {
    this.log('ERROR', message, error)
  }
}