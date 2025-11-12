import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 获取用户营养分析数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "本周" // 本周/上周/本月
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

    // 计算日期范围
    const now = new Date()
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(timeframe, now)

    // 获取当前时间范围的数据
    const { data: currentMeals, error: currentError } = await supabase
      .from("user_meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("meal_date", startDate)
      .lte("meal_date", endDate)
      .order("meal_date", { ascending: true })

    if (currentError) {
      console.error("获取当前餐食记录错误:", currentError)
      return NextResponse.json(
        { error: "查询失败" },
        { status: 500 }
      )
    }

    // 获取上一个时间范围的数据（用于对比趋势）
    const { data: prevMeals, error: prevError } = await supabase
      .from("user_meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("meal_date", prevStartDate)
      .lte("meal_date", prevEndDate)

    if (prevError) {
      console.error("获取上期餐食记录错误:", prevError)
    }

    // 获取用户配置
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // 计算统计数据
    const analytics = calculateAnalytics(
      currentMeals || [],
      prevMeals || [],
      timeframe,
      profile?.daily_calorie_goal || 1900
    )

    return NextResponse.json({
      success: true,
      ...analytics,
    })
  } catch (error) {
    console.error("获取营养分析错误:", error)
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    )
  }
}

// 计算日期范围
function getDateRange(timeframe: string, now: Date) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  let startDate: string
  let endDate: string
  let prevStartDate: string
  let prevEndDate: string

  if (timeframe === "本周") {
    // 本周（周一到今天）
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 周日为0，调整为6
    const monday = new Date(today)
    monday.setDate(today.getDate() - diff)
    
    startDate = formatDate(monday)
    endDate = formatDate(today)
    
    // 上周
    const lastMonday = new Date(monday)
    lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(monday)
    lastSunday.setDate(monday.getDate() - 1)
    
    prevStartDate = formatDate(lastMonday)
    prevEndDate = formatDate(lastSunday)
  } else if (timeframe === "上周") {
    // 上周（周一到周日）
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() - diff)
    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(thisMonday.getDate() - 7)
    const lastSunday = new Date(thisMonday)
    lastSunday.setDate(thisMonday.getDate() - 1)
    
    startDate = formatDate(lastMonday)
    endDate = formatDate(lastSunday)
    
    // 上上周
    const prevLastMonday = new Date(lastMonday)
    prevLastMonday.setDate(lastMonday.getDate() - 7)
    const prevLastSunday = new Date(lastMonday)
    prevLastSunday.setDate(lastMonday.getDate() - 1)
    
    prevStartDate = formatDate(prevLastMonday)
    prevEndDate = formatDate(prevLastSunday)
  } else {
    // 本月
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    startDate = formatDate(firstDay)
    endDate = formatDate(today)
    
    // 上月
    const lastMonthFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0)
    
    prevStartDate = formatDate(lastMonthFirstDay)
    prevEndDate = formatDate(lastMonthLastDay)
  }

  return { startDate, endDate, prevStartDate, prevEndDate }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 计算营养分析数据
function calculateAnalytics(
  currentMeals: any[],
  prevMeals: any[],
  timeframe: string,
  dailyCalorieGoal: number
) {
  // 按日期分组数据
  const dailyData = groupByDate(currentMeals, timeframe)
  
  // 计算当前时间段的平均值
  const currentStats = calculateAverageStats(currentMeals)
  
  // 计算上一时间段的平均值
  const prevStats = calculateAverageStats(prevMeals)
  
  // 计算趋势（百分比变化）
  const stats = {
    avgCalories: Math.round(currentStats.calories),
    caloriesTrend: calculateTrend(currentStats.calories, prevStats.calories),
    prevCalories: Math.round(prevStats.calories),
    avgProtein: Math.round(currentStats.protein),
    proteinTrend: calculateTrend(currentStats.protein, prevStats.protein),
    prevProtein: Math.round(prevStats.protein),
    avgCarbs: Math.round(currentStats.carbs),
    carbsTrend: calculateTrend(currentStats.carbs, prevStats.carbs),
    prevCarbs: Math.round(prevStats.carbs),
    avgFats: Math.round(currentStats.fats),
    fatsTrend: calculateTrend(currentStats.fats, prevStats.fats),
    prevFats: Math.round(prevStats.fats),
  }

  return {
    stats,
    dailyData,
    dailyCalorieGoal,
  }
}

// 按日期分组并计算每日总和
function groupByDate(meals: any[], timeframe: string) {
  const grouped: { [key: string]: any } = {}
  
  meals.forEach(meal => {
    const date = meal.meal_date
    if (!grouped[date]) {
      grouped[date] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }
    }
    grouped[date].calories += meal.calories || 0
    grouped[date].protein += meal.protein || 0
    grouped[date].carbs += meal.carbs || 0
    grouped[date].fats += meal.fats || 0
  })

  // 转换为数组格式，适配图表
  const result = Object.entries(grouped).map(([date, data]) => {
    const d = new Date(date)
    let dayLabel = ""
    
    if (timeframe === "本月" || timeframe === "上月") {
      dayLabel = `${d.getMonth() + 1}/${d.getDate()}`
    } else {
      const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
      dayLabel = days[d.getDay()]
    }
    
    return {
      day: dayLabel,
      date: date,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      carbs: Math.round(data.carbs),
      fats: Math.round(data.fats),
    }
  })

  // 按日期排序
  result.sort((a, b) => a.date.localeCompare(b.date))
  
  return result
}

// 计算平均统计值
function calculateAverageStats(meals: any[]) {
  if (meals.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  }

  // 按日期分组后计算平均
  const dailyTotals: { [key: string]: any } = {}
  
  meals.forEach(meal => {
    const date = meal.meal_date
    if (!dailyTotals[date]) {
      dailyTotals[date] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }
    }
    dailyTotals[date].calories += meal.calories || 0
    dailyTotals[date].protein += meal.protein || 0
    dailyTotals[date].carbs += meal.carbs || 0
    dailyTotals[date].fats += meal.fats || 0
  })

  const days = Object.keys(dailyTotals).length
  if (days === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  }

  const totals = Object.values(dailyTotals).reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  return {
    calories: totals.calories / days,
    protein: totals.protein / days,
    carbs: totals.carbs / days,
    fats: totals.fats / days,
  }
}

// 计算趋势百分比
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  const trend = ((current - previous) / previous) * 100
  return Math.round(trend * 10) / 10 // 保留一位小数
}
