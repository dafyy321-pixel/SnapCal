import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 获取用户餐食记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") // 格式: YYYY-MM-DD
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

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      )
    }

    // 获取用户配置
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // 构建查询
    let query = supabase
      .from("user_meals")
      .select("*")
      .eq("user_id", user.id)
      .order("meal_time", { ascending: true })

    // 如果指定了日期，只查询该日期的数据
    if (date) {
      query = query.eq("meal_date", date)
    }

    const { data: meals, error } = await query

    if (error) {
      console.error("获取餐食记录错误:", error)
      return NextResponse.json(
        { error: "查询失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: profile || {
        daily_calorie_goal: 1800,
        daily_protein_goal: 50,
        daily_carbs_goal: 30,
        daily_fats_goal: 20,
      },
      meals: meals || [],
    })
  } catch (error) {
    console.error("获取餐食记录错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}

// 添加餐食记录
export async function POST(request: NextRequest) {
  try {
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

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      meal_name, meal_type, meal_date, meal_time, calories, protein, carbs, fats, image_url,
      fiber, sugar, sodium, calcium, vitamin_c, iron, cholesterol, saturated_fat, trans_fat,
      potassium, vitamin_a, vitamin_d, vitamin_e, ingredients, confidence
    } = body

    // 验证必填字段
    if (!meal_name || !meal_type || !meal_date || !meal_time) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 获取用户手机号
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("phone")
      .eq("user_id", user.id)
      .single()

    const { data, error } = await supabase
      .from("user_meals")
      .insert({
        user_id: user.id,
        phone: profile?.phone || "",
        meal_name,
        meal_type,
        meal_date,
        meal_time,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
        image_url: image_url || null,
        fiber: fiber || 0,
        sugar: sugar || 0,
        sodium: sodium || 0,
        calcium: calcium || 0,
        vitamin_c: vitamin_c || 0,
        iron: iron || 0,
        cholesterol: cholesterol || 0,
        saturated_fat: saturated_fat || 0,
        trans_fat: trans_fat || 0,
        potassium: potassium || 0,
        vitamin_a: vitamin_a || 0,
        vitamin_d: vitamin_d || 0,
        vitamin_e: vitamin_e || 0,
        ingredients: ingredients || [],
        confidence: confidence || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("添加餐食记录错误:", error)
      return NextResponse.json(
        { error: "添加失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      meal: data,
    })
  } catch (error) {
    console.error("添加餐食记录错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}
