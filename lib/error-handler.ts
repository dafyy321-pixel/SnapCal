import { NextResponse } from "next/server"

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "UNKNOWN_ERROR",
    public details?: unknown
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "资源未找到") {
    super(message, 404, "NOT_FOUND")
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: { message: string; code: string; details?: unknown }
  timestamp: string
}

export function successResponse<T>(data: T, statusCode = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status: statusCode })
}

export function errorResponse(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && error.details !== undefined ? { details: error.details } : {}),
      },
      timestamp: new Date().toISOString(),
    }, { status: error.statusCode })
  }

  const known = error instanceof Error ? error as Error & { code?: string; errcode?: number } : null
  const constraint = known?.code?.startsWith("SQLITE_CONSTRAINT") || (known?.code === "ERR_SQLITE_ERROR" && [1555, 2067, 787].includes(known.errcode ?? 0))
  console.error("[API Error]", error)
  return NextResponse.json({
    success: false,
    error: {
      message: constraint ? "数据冲突，请勿重复提交" : "服务器内部错误",
      code: constraint ? "CONFLICT" : "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && known ? { details: known.message } : {}),
    },
    timestamp: new Date().toISOString(),
  }, { status: constraint ? 409 : 500 })
}
