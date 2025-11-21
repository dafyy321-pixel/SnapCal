/**
 * API响应标准化工具
 * 统一所有API接口的响应格式和错误处理
 */

import { ApiResponse } from '@/types'
import { successResponse, errorResponse } from './error-handler'

/**
 * 标准化的API响应接口
 */
export interface StandardApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
    version?: string
  }
}

/**
 * 创建标准成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string
    requestId?: string
    version?: string
  }
): StandardApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
      version: options?.version || '1.0.0'
    }
  }
}

/**
 * 创建标准错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  options?: {
    details?: any
    requestId?: string
    version?: string
  }
): StandardApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details: options?.details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
      version: options?.version || '1.0.0'
    }
  }
}

/**
 * 转换旧格式API响应为新标准格式
 */
export function normalizeApiResponse(response: any): StandardApiResponse {
  // 如果已经是标准格式，直接返回
  if (response.success !== undefined) {
    return {
      ...response,
      meta: {
        timestamp: response.timestamp || new Date().toISOString(),
        ...response.meta
      }
    }
  }

  // 尝试转换旧格式
  return {
    success: !response.error,
    data: response.data || response,
    error: response.error ? {
      code: response.error.code || 'UNKNOWN_ERROR',
      message: response.error.message || '未知错误',
      details: response.error.details
    } : undefined,
    meta: {
      timestamp: response.timestamp || new Date().toISOString()
    }
  }
}

/**
 * API响应包装器 - 包装Next.js Response
 */
export function wrapApiNextResponse<T>(
  response: StandardApiResponse<T>,
  statusCode: number = 200
): Response {
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

/**
 * 快捷方法：成功响应
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    message?: string
    requestId?: string
    statusCode?: number
  }
): Response {
  const response = createSuccessResponse(data, options)
  return wrapApiNextResponse(response, options?.statusCode || 200)
}

/**
 * 快捷方法：错误响应
 */
export function apiError(
  code: string,
  message: string,
  statusCode: number = 400,
  options?: {
    details?: any
    requestId?: string
  }
): Response {
  const response = createErrorResponse(code, message, options)
  return wrapApiNextResponse(response, statusCode)
}

/**
 * 验证API响应格式
 */
export function validateApiResponse(response: any): StandardApiResponse {
  if (typeof response !== 'object' || response === null) {
    throw new Error('API响应必须是对象类型')
  }

  if (response.success === undefined) {
    throw new Error('API响应缺少success字段')
  }

  if (typeof response.success !== 'boolean') {
    throw new Error('success字段必须是布尔类型')
  }

  if (!response.success && !response.error) {
    throw new Error('失败响应必须包含error字段')
  }

  return response as StandardApiResponse
}

/**
 * 常用的API错误代码
 */
export const ApiErrorCodes = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // 认证相关
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // 餐食相关
  MEAL_NOT_FOUND: 'MEAL_NOT_FOUND',
  INVALID_MEAL_DATA: 'INVALID_MEAL_DATA',
  MEAL_CREATION_FAILED: 'MEAL_CREATION_FAILED',

  // 分析相关
  ANALYSIS_NOT_FOUND: 'ANALYSIS_NOT_FOUND',
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
  INVALID_IMAGE_FORMAT: 'INVALID_IMAGE_FORMAT',

  // 文件相关
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED'
} as const

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes]