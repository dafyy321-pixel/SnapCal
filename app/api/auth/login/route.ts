import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    // 验证输入
    if (!phone || !password) {
      return NextResponse.json(
        { error: "手机号和密码不能为空" },
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

    // 使用 service role 来查询登录记录（绕过 RLS）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 直接从 user_login_records 查询 email（查找最早的有 email 的记录）
    const { data: loginRecords, error: queryError } = await supabaseAdmin
      .from('user_login_records')
      .select('email')
      .eq('phone', phone)
      .not('email', 'is', null)
      .order('login_time', { ascending: true })
      .limit(1)

    console.log("查询手机号:", phone)
    console.log("查询结果:", loginRecords)
    console.log("查询错误:", queryError)

    if (queryError || !loginRecords || loginRecords.length === 0 || !loginRecords[0].email) {
      console.log("手机号未注册或email为空")
      return NextResponse.json(
        { error: "手机号未注册" },
        { status: 401 }
      )
    }

    const email = loginRecords[0].email

    // 使用普通 supabase 客户端进行认证
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 使用邮箱和密码登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: "手机号或密码错误" },
        { status: 401 }
      )
    }

    // 记录登录信息到数据库
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // 获取用户名（从用户元数据中获取）
    const username = data.user?.user_metadata?.username || ""

    await supabaseAdmin.from("user_login_records").insert({
      phone,
      email, // 保存 email
      username,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        phone,
        username,
      },
      session: data.session,
    })
  } catch (error) {
    console.error("登录错误:", error)
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    )
  }
}
