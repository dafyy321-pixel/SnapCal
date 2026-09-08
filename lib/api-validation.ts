import type { output, ZodTypeAny } from "zod"
import { ValidationError } from "./error-handler"
import { assertContentType, assertWriteOrigin } from "./request-security"

export function parseInput<TSchema extends ZodTypeAny>(schema: TSchema, input: unknown): output<TSchema> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new ValidationError(
      "请求数据格式不正确",
      result.error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message,
      }))
    )
  }
  return result.data as output<TSchema>
}

export async function readJson(request: Request): Promise<unknown> {
  assertWriteOrigin(request)
  assertContentType(request, "application/json")
  try {
    return await request.json()
  } catch {
    throw new ValidationError("请求体必须是有效的 JSON")
  }
}
