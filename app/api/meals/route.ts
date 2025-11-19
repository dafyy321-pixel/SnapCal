import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { withValidation, withMultiValidation, withConditionalValidation } from "@/lib/validation-middleware"
import { successResponse, errorResponse } from "@/lib/error-handler"
import { createClient } from "@supabase/supabase-js"
import {
  createMealSchema,
  updateMealSchema,
  listQuerySchema,
  dateSchema,
  routeParamsSchema
} from "@/lib/validation-schemas"
import { z } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// 服务端路由使用 Service Role Key，以配合前置的 withAuth 认证并避免 RLS 拒绝插入/更新
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 餐食列表查询参数schema
const mealsQuerySchema = listQuerySchema.extend({
  date: dateSchema.optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
})

// 获取用户餐食记录
async function getMealsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const user = request.user!
    const { limit, offset, sort_by, sort_order, search, date, meal_type } = request.validatedData

    // 获取用户配置
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // 构建查询
    let query = supabase
      .from("user_meals")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)

    // 应用过滤器
    if (date) {
      query = query.eq("meal_date", date)
    }

    if (meal_type) {
      query = query.eq("meal_type", meal_type)
    }

    if (search) {
      query = query.ilike("meal_name", `%${search}%`)
    }

    // 应用排序
    if (sort_by) {
      query = query.order(sort_by, { ascending: sort_order === "asc" })
    } else {
      query = query.order("meal_time", { ascending: false })
    }

    // 应用分页
    query = query.range(offset, offset + limit - 1)

    const { data: meals, error, count } = await query

    if (error) {
      throw error
    }

    return successResponse({
      profile: profile || {
        daily_calorie_goal: 1800,
        daily_protein_goal: 50,
        daily_carbs_goal: 30,
        daily_fats_goal: 20,
      },
      meals: meals || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// 添加餐食记录
async function createMealHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const user = request.user!
    const mealData = request.validatedData

    // 获取用户手机号
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("phone")
      .eq("user_id", user.id)
      .single()

    const { data } = await supabase
      .from("user_meals")
      .insert({
        user_id: user.id,
        phone: profile?.phone || "",
        ...mealData,
        // 确保所有营养字段都有默认值
        calories: mealData.calories || 0,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fats: mealData.fats || 0,
        image_url: mealData.image_url || null,
        ingredients: mealData.ingredients || [],
        confidence: mealData.confidence || 0,
        // 扩展营养字段默认值
        fiber: 0,
        sugar: 0,
        sodium: 0,
        calcium: 0,
        vitamin_c: 0,
        iron: 0,
        cholesterol: 0,
        saturated_fat: 0,
        trans_fat: 0,
        potassium: 0,
        vitamin_a: 0,
        vitamin_d: 0,
        vitamin_e: 0,
      })
      .select()
      .single()

    return successResponse({ meal: data }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

// 批量创建餐食记录schema
const batchCreateMealsSchema = z.object({
  meals: z.array(createMealSchema).min(1, "至少需要一条餐食记录").max(10, "一次最多创建10条记录"),
})

// 批量创建餐食记录
async function batchCreateMealsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const user = request.user!
    const { meals } = request.validatedData

    // 获取用户手机号
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("phone")
      .eq("user_id", user.id)
      .single()

    // 准备插入数据
    const insertData = meals.map((meal: any) => ({
      user_id: user.id,
      phone: profile?.phone || "",
      ...meal,
      // 确保所有营养字段都有默认值
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fats: meal.fats || 0,
      image_url: meal.image_url || null,
      ingredients: meal.ingredients || [],
      confidence: meal.confidence || 0,
      // 扩展营养字段默认值
      fiber: 0,
      sugar: 0,
      sodium: 0,
      calcium: 0,
      vitamin_c: 0,
      iron: 0,
      cholesterol: 0,
      saturated_fat: 0,
      trans_fat: 0,
      potassium: 0,
      vitamin_a: 0,
      vitamin_d: 0,
      vitamin_e: 0,
    }))

    const { data } = await supabase
      .from("user_meals")
      .insert(insertData)
      .select()

    return successResponse({
      meals: data || [],
      created_count: data?.length || 0
    }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

// 判断是否为批量创建的条件函数
const isBatchCreate = (request: NextRequest) => {
  const url = new URL(request.url)
  return url.searchParams.has('batch') && url.searchParams.get('batch') === 'true'
}

// 🔒 使用认证和验证中间件包装API处理函数
export const GET = withAuth(
  withValidation(mealsQuerySchema, 'query')(getMealsHandler) as any
) as any

export const POST = withAuth(
  withConditionalValidation(
    isBatchCreate,
    batchCreateMealsSchema,
    'body'
  )(
    withMultiValidation([
      { schema: createMealSchema, source: 'body' }
    ])(createMealHandler) as any
  ) as any
) as any

// 批量创建处理函数（单独导出，供内部使用）
export const BATCH_POST = withAuth(
  withValidation(batchCreateMealsSchema, 'body')(batchCreateMealsHandler) as any
) as any