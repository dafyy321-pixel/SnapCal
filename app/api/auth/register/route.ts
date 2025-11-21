import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  ValidationError,
  ConflictError,
  successResponse,
  errorResponse,
  withErrorHandler,
  Logger
} from "@/lib/error-handler"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const POST = withErrorHandler(async (request: NextRequest) => {
  Logger.info('用户注册请求开始')

  const { phone, password, username } = await request.json()

  // 验证输入
  if (!phone || !password || !username) {
    throw new ValidationError("手机号、用户名和密码不能为空")
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    throw new ValidationError("手机号格式不正确")
  }

  // 验证密码长度
  if (password.length < 6) {
    throw new ValidationError("密码长度至少为6位")
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
    Logger.error('检查手机号错误', checkError)
  }

  if (existingRecords && existingRecords.length > 0) {
    Logger.warn('手机号已注册', { phone })
    throw new ConflictError("该手机号已注册")
  }

  // 使用唯一的邮箱格式（手机号+随机数）
  const email = `user_${phone}_${Math.random().toString(36).substring(2, 11)}@snapcal.app`

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
    Logger.warn('创建用户失败', { phone, error: error.message })
    if (error.message.includes("already registered")) {
      throw new ConflictError("该手机号已注册")
    }
    throw new ValidationError(error.message)
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

  Logger.info('用户注册成功', { phone, userId: data.user?.id })

  return successResponse({
    message: "注册成功",
    user: {
      id: data.user?.id,
      phone,
      username,
    },
  })
})
