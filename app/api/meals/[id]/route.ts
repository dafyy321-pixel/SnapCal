import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 获取单条餐食详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      )
    }

    const { data: meal, error } = await supabase
      .from("user_meals")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("获取餐食详情错误:", error)
      return NextResponse.json(
        { error: "查询失败" },
        { status: 500 }
      )
    }

    if (!meal) {
      return NextResponse.json(
        { error: "餐食不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      meal,
    })
  } catch (error) {
    console.error("获取餐食详情错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}

// 删除餐食记录
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      )
    }

    // 先检查是否存在且属于当前用户
    const { data: existing } = await supabase
      .from("user_meals")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "餐食不存在或无权限删除" },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from("user_meals")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("删除餐食记录错误:", error)
      return NextResponse.json(
        { error: "删除失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    })
  } catch (error) {
    console.error("删除餐食记录错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}

// 更新餐食记录（编辑功能）
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 先检查是否存在且属于当前用户
    const { data: existing } = await supabase
      .from("user_meals")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "餐食不存在或无权限编辑" },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from("user_meals")
      .update(body)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("更新餐食记录错误:", error)
      return NextResponse.json(
        { error: "更新失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      meal: data,
    })
  } catch (error) {
    console.error("更新餐食记录错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}
