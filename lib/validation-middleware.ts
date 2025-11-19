import { NextRequest } from "next/server"
import { z } from "zod"
import { ValidationError, errorResponse } from "./error-handler"

/**
 * 验证中间件工厂函数
 * 为API路由添加请求数据验证
 *
 * @param schema Zod schema用于验证请求数据
 * @param source 数据来源：'body' | 'query' | 'params' | 'headers'
 * @returns 包装后的处理函数
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'params' | 'headers' = 'body'
) {
  return function <U extends NextRequest>(
    handler: (request: U & { validatedData: T }, ...args: any[]) => Promise<Response>
  ) {
    return async (request: U, ...args: any[]): Promise<Response> => {
      try {
        let data: any

        switch (source) {
          case 'body':
            // 对于GET、DELETE等没有body的请求，返回空对象
            if (['GET', 'DELETE', 'HEAD'].includes(request.method)) {
              data = {}
            } else {
              // 检查Content-Type
              const contentType = request.headers.get('content-type')
              if (!contentType?.includes('application/json')) {
                throw new ValidationError(
                  'Content-Type必须是application/json',
                  'INVALID_CONTENT_TYPE'
                )
              }
              data = await request.json()
            }
            break

          case 'query':
            const { searchParams } = new URL(request.url)
            data = Object.fromEntries(searchParams.entries())
            break

          case 'params':
            // 从context中提取params（仅对动态路由有效）
            const context = args[0]
            data = context?.params || {}
            break

          case 'headers':
            data = Object.fromEntries(request.headers.entries())
            break

          default:
            throw new ValidationError(
              '无效的验证数据源',
              'INVALID_VALIDATION_SOURCE'
            )
        }

        // 执行验证
        const validatedData = await schema.parseAsync(data)

        // 将验证后的数据注入到request对象中
        ;(request as any).validatedData = validatedData

        // 调用原始处理函数
        return await handler(request as U & { validatedData: T }, ...args)
      } catch (error) {
        return errorResponse(error)
      }
    }
  }
}

/**
 * 多源验证中间件
 * 同时验证多个数据源
 */
export function withMultiValidation<T>(
  validations: Array<{
    schema: z.ZodSchema<any>
    source: 'body' | 'query' | 'params' | 'headers'
    key?: string // 注入到request中的键名
  }>
) {
  return function <U extends NextRequest>(
    handler: (request: U & { [key: string]: any }, ...args: any[]) => Promise<Response>
  ) {
    return async (request: U, ...args: any[]): Promise<Response> => {
      try {
        const validatedResults: { [key: string]: any } = {}
        const aggregatedValidatedData: { [key: string]: any } = {}

        // 逐一执行验证
        for (const validation of validations) {
          let data: any

          switch (validation.source) {
            case 'body':
              if (['GET', 'DELETE', 'HEAD'].includes(request.method)) {
                data = {}
              } else {
                const contentType = request.headers.get('content-type')
                if (!contentType?.includes('application/json')) {
                  throw new ValidationError(
                    'Content-Type必须是application/json',
                    'INVALID_CONTENT_TYPE'
                  )
                }
                data = await request.json()
              }
              break

            case 'query':
              const { searchParams } = new URL(request.url)
              data = Object.fromEntries(searchParams.entries())
              break

            case 'params':
              const context = args[0]
              // Next 15 中 params 是 Promise，需要在访问前解包
              if (context && context.params) {
                const maybePromise = context.params as any
                data = typeof maybePromise.then === 'function'
                  ? await maybePromise
                  : maybePromise
              } else {
                data = {}
              }
              break

            case 'headers':
              data = Object.fromEntries(request.headers.entries())
              break

            default:
              throw new ValidationError(
                '无效的验证数据源',
                'INVALID_VALIDATION_SOURCE'
              )
          }

          // 执行验证
          const validatedData = await validation.schema.parseAsync(data)

          // 为每个数据源选择一个安全的键名，避免覆盖 NextRequest 自带属性
          const defaultKey = (() => {
            switch (validation.source) {
              case 'body':
                return 'validatedData'
              case 'query':
                return 'validatedQuery'
              case 'params':
                return 'validatedParams'
              case 'headers':
                return 'validatedHeaders'
              default:
                return `validated_${validation.source}`
            }
          })()

          const resultKey = validation.key || defaultKey
          validatedResults[resultKey] = validatedData

          // 如果为该验证显式提供了 key，则聚合到 validatedData 对象中
          if (validation.key) {
            aggregatedValidatedData[validation.key] = validatedData
          }
        }

        // 如果有通过 key 聚合的数据且还没有 validatedData，则构造一个统一的 validatedData
        if (Object.keys(aggregatedValidatedData).length > 0 && !('validatedData' in validatedResults)) {
          validatedResults.validatedData = aggregatedValidatedData
        }

        // 将所有验证结果注入到request对象中（只使用自定义键名，不覆盖原有属性）
        Object.assign(request as any, validatedResults)

        // 如果存在通用的 validatedData，则保持与 withValidation 的一致行为
        if ('validatedData' in validatedResults) {
          ;(request as any).validatedData = validatedResults['validatedData']
        }

        // 调用原始处理函数
        return await handler(request as U & { [key: string]: any }, ...args)
      } catch (error) {
        return errorResponse(error)
      }
    }
  }
}

/**
 * 条件验证中间件
 * 根据条件执行不同的验证
 */
export function withConditionalValidation<T>(
  condition: (request: NextRequest) => boolean,
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' | 'params' | 'headers' = 'body'
) {
  return function <U extends NextRequest>(
    handler: (request: U, ...args: any[]) => Promise<Response>
  ) {
    return async (request: U, ...args: any[]): Promise<Response> => {
      try {
        // 检查条件
        if (!condition(request)) {
          // 条件不满足，直接调用原始处理函数
          return await handler(request, ...args)
        }

        // 条件满足，执行验证
        let data: any

        switch (source) {
          case 'body':
            if (['GET', 'DELETE', 'HEAD'].includes(request.method)) {
              data = {}
            } else {
              const contentType = request.headers.get('content-type')
              if (!contentType?.includes('application/json')) {
                throw new ValidationError(
                  'Content-Type必须是application/json',
                  'INVALID_CONTENT_TYPE'
                )
              }
              data = await request.json()
            }
            break

          case 'query':
            const { searchParams } = new URL(request.url)
            data = Object.fromEntries(searchParams.entries())
            break

          case 'params':
            const context = args[0]
            data = context?.params || {}
            break

          case 'headers':
            data = Object.fromEntries(request.headers.entries())
            break

          default:
            throw new ValidationError(
              '无效的验证数据源',
              'INVALID_VALIDATION_SOURCE'
            )
        }

        // 执行验证
        const validatedData = await schema.parseAsync(data)
        request.validatedData = validatedData

        // 调用原始处理函数
        return await handler(request, ...args)
      } catch (error) {
        return errorResponse(error)
      }
    }
  }
}

/**
 * 文件上传验证中间件
 * 专门用于处理文件上传的验证
 */
export function withFileValidation<T>(
  options: {
    maxSize?: number // 最大文件大小（字节）
    allowedTypes?: string[] // 允许的MIME类型
    maxFiles?: number // 最大文件数量
    requiredFields?: string[] // 必需的字段
  }
) {
  return function <U extends NextRequest>(
    handler: (request: U & { validatedFiles?: any }, ...args: any[]) => Promise<Response>
  ) {
    return async (request: U, ...args: any[]): Promise<Response> => {
      try {
        const contentType = request.headers.get('content-type')

        // 检查是否为multipart/form-data
        if (!contentType?.includes('multipart/form-data')) {
          throw new ValidationError(
            '文件上传必须使用multipart/form-data',
            'INVALID_CONTENT_TYPE'
          )
        }

        // 解析表单数据
        const formData = await request.formData()
        const files: any = {}
        const fields: any = {}

        // 验证必需字段
        if (options.requiredFields) {
          for (const field of options.requiredFields) {
            const value = formData.get(field)
            if (!value) {
              throw new ValidationError(
                `缺少必需字段: ${field}`,
                'MISSING_REQUIRED_FIELD'
              )
            }
            if (value instanceof File) {
              files[field] = value
            } else {
              fields[field] = value
            }
          }
        }

        // 处理其他文件
        let fileCount = 0
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            fileCount++

            // 检查文件数量限制
            if (options.maxFiles && fileCount > options.maxFiles) {
              throw new ValidationError(
                `文件数量超过限制，最大允许${options.maxFiles}个文件`,
                'TOO_MANY_FILES'
              )
            }

            // 检查文件大小
            if (options.maxSize && value.size > options.maxSize) {
              throw new ValidationError(
                `文件${key}大小超过限制，最大允许${Math.round(options.maxSize / 1024 / 1024)}MB`,
                'FILE_TOO_LARGE'
              )
            }

            // 检查文件类型
            if (options.allowedTypes && !options.allowedTypes.includes(value.type)) {
              throw new ValidationError(
                `文件${key}类型不允许，允许的类型: ${options.allowedTypes.join(', ')}`,
                'INVALID_FILE_TYPE'
              )
            }

            files[key] = value
          } else if (!options.requiredFields?.includes(key)) {
            fields[key] = value
          }
        }

        // 注入验证后的数据
        request.validatedFiles = files
        request.validatedFields = fields

        // 调用原始处理函数
        return await handler(request, ...args)
      } catch (error) {
        return errorResponse(error)
      }
    }
  }
}

/**
 * 扩展NextRequest类型以包含验证数据
 */
declare module "next/server" {
  interface NextRequest {
    validatedData?: any
    validatedFiles?: any
    validatedFields?: any
    user?: any
    token?: string
  }
}