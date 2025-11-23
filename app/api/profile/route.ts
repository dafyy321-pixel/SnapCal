import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { successResponse, errorResponse } from "@/lib/error-handler"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 获取用户资料
async function getProfileHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const user = request.user!

    // 获取用户资料
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // 如果没有资料，返回默认值
    const defaultProfile = {
      user_id: user.id,
      email: user.email,
      phone: user.phone || null,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      daily_calorie_goal: 1800,
      daily_protein_goal: 50,
      daily_carbs_goal: 30,
      daily_fats_goal: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return successResponse({
      profile: profile || defaultProfile,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        user_metadata: user.user_metadata,
      }
    })

  } catch (error) {
    return errorResponse(error)
  }
}

// 更新用户资料
async function updateProfileHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const user = request.user!
    const updateData = await request.json()

    // 准备更新数据
    const profileData = {
      ...updateData,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    // 使用upsert - 如果存在则更新，不存在则创建
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .upsert(profileData, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse({
      profile,
      message: "用户资料更新成功"
    })

  } catch (error) {
    return errorResponse(error)
  }
}

// 🔒 使用认证中间件包装API处理函数
export const GET = withAuth(getProfileHandler)
export const PUT = withAuth(updateProfileHandler)