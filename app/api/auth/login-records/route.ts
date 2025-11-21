import { NextRequest } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { successResponse, errorResponse, Logger } from "@/lib/error-handler"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 使用服务密钥来查询所有记录

async function getLoginRecordsHandler(request: NextRequest) {
  const user = request.user // 通过withAuth中间件注入

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 从URL参数中获取过滤条件
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000) // 最大限制1000条
  const offset = parseInt(searchParams.get("offset") || "0")

  let query = supabase
    .from("user_login_records")
    .select("*", { count: "exact" })
    .order("login_time", { ascending: false })

  // 🔒 权限控制：普通用户只能查询自己的登录记录
  // TODO: 检查用户是否有管理员权限，如果有则允许查询所有用户
  const isAdmin = false // 这里需要根据实际业务逻辑判断

  if (!isAdmin) {
    // 普通用户只能查询自己的手机号记录
    query = query.eq("phone", user.phone)
  } else if (phone) {
    // 管理员可以按手机号筛选
    query = query.eq("phone", phone)
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    throw error
  }

  return successResponse({
    total: count,
    records: data,
    user_type: isAdmin ? "admin" : "user",
  })
}

// 🔒 使用认证中间件包装API处理函数
export const GET = withAuth(getLoginRecordsHandler)
