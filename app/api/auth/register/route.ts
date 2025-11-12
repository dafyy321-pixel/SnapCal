import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { phone, password, username } = await request.json()

    // 验证输入
    if (!phone || !password || !username) {
      return NextResponse.json(
        { error: "手机号、用户名和密码不能为空" },
        { status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      )
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为6位" },
        { status: 400 }
      )
    }

    // 使用 service role key 创建管理员客户端
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 检查手机号是否已经注册
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from("user_login_records")
      .select("phone")
      .eq("phone", phone)
      .limit(1)

    if (checkError) {
      console.error("检查手机号错误:", checkError)
    }

    if (existingRecords && existingRecords.length > 0) {
      return NextResponse.json(
        { error: "该手机号已注册" },
        { status: 400 }
      )
    }

    // 使用唯一的邮箱格式（手机号+随机数）
    const email = `user_${phone}_${Math.random().toString(36).substr(2, 9)}@local.app`
    
    // 使用 admin API 创建用户，自动确认邮箱
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        username,
        phone,
        email,
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "该手机号已注册" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // 注册成功后也记录一次登录，并存储email
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    await supabaseAdmin.from("user_login_records").insert({
      phone,
      email, // 存储邮箱，供后续登录使用
      username,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    // 创建用户配置记录（默认目标值）
    await supabaseAdmin.from("user_profiles").insert({
      user_id: data.user?.id,
      phone,
      username,
      daily_calorie_goal: 1800,
      daily_protein_goal: 50,
      daily_carbs_goal: 30,
      daily_fats_goal: 20,
    })

    return NextResponse.json({
      success: true,
      message: "注册成功",
      user: {
        id: data.user?.id,
        phone,
        username,
      },
    })
  } catch (error) {
    console.error("注册错误:", error)
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    )
  }
}
