import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { withValidation, withMultiValidation } from "@/lib/validation-middleware"
import { errorResponse, successResponse, NotFoundError } from "@/lib/error-handler"
import { createClient } from "@supabase/supabase-js"
import {
  updateMealSchema,
  routeParamsSchema
} from "@/lib/validation-schemas"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// 使用 Service Role Key，配合 withAuth 手动控制 user_id，避免 RLS 拦截
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 获取单条餐食详情
async function getMealHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user
    const { id } = request.validatedData.params
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: meal, error } = await supabase
      .from("user_meals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return successResponse({ error: "餐食不存在" }, 404)
      }
      throw error
    }

    return successResponse({ meal })
  } catch (error) {
    return errorResponse(error)
  }
}

// 删除餐食记录
async function deleteMealHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user
    const { id } = request.validatedData.params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 先检查是否存在且属于当前用户
    const { data: existing } = await supabase
      .from("user_meals")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      // 使用统一的错误响应格式，返回 404 和明确的错误信息
      throw new NotFoundError("餐食不存在或无权限删除")
    }

    const { error } = await supabase
      .from("user_meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      throw error
    }

    return successResponse({ message: "删除成功" })
  } catch (error) {
    return errorResponse(error)
  }
}

// 更新餐食记录（编辑功能）
async function updateMealHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user
    const { id } = request.validatedData.params
    const updateData = request.validatedData.body

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 先检查是否存在且属于当前用户
    const { data: existing } = await supabase
      .from("user_meals")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return successResponse({ error: "餐食不存在或无权限编辑" }, 404)
    }

    const { data, error } = await supabase
      .from("user_meals")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse({ meal: data })
  } catch (error) {
    return errorResponse(error)
  }
}

// 🔒 使用认证和验证中间件包装所有API处理函数
export const GET = withAuth(
  withMultiValidation([
    { schema: routeParamsSchema, source: 'params', key: 'params' }
  ])(getMealHandler) as any
) as any

export const DELETE = withAuth(
  withMultiValidation([
    { schema: routeParamsSchema, source: 'params', key: 'params' }
  ])(deleteMealHandler) as any
) as any

export const PATCH = withAuth(
  withMultiValidation([
    { schema: routeParamsSchema, source: 'params', key: 'params' },
    { schema: updateMealSchema, source: 'body', key: 'body' }
  ])(updateMealHandler) as any
) as any