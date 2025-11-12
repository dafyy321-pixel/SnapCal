import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 使用服务密钥来查询所有记录

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 从URL参数中获取过滤条件
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("user_login_records")
      .select("*", { count: "exact" })
      .order("login_time", { ascending: false })

    // 如果提供了手机号，则筛选
    if (phone) {
      query = query.eq("phone", phone)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: "查询失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      total: count,
      records: data,
    })
  } catch (error) {
    console.error("查询登录记录错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}
