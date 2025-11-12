import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
})

// 用户登录状态管理
export const authService = {
  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 获取当前会话
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 设置会话
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return { data, error }
  },
}

// 餐食数据管理
export const mealsService = {
  // 获取指定日期的餐食记录
  async getMealsByDate(date: string) {
    const session = await authService.getSession()
    if (!session?.access_token) {
      throw new Error("未登录")
    }

    const response = await fetch(`/api/meals?date=${date}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error("获取餐食记录失败")
    }

    return await response.json()
  },

  // 添加餐食记录
  async addMeal(mealData: {
    meal_name: string
    meal_type: string
    meal_date: string
    meal_time: string
    calories: number
    protein: number
    carbs: number
    fats: number
    image_url?: string
    // 详细营养信息
    fiber?: number
    sugar?: number
    sodium?: number
    calcium?: number
    vitamin_c?: number
    iron?: number
    cholesterol?: number
    saturated_fat?: number
    trans_fat?: number
    potassium?: number
    vitamin_a?: number
    vitamin_d?: number
    vitamin_e?: number
    ingredients?: string[]
    confidence?: number
  }) {
    const session = await authService.getSession()
    if (!session?.access_token) {
      throw new Error("未登录")
    }

    const response = await fetch("/api/meals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(mealData),
    })

    if (!response.ok) {
      throw new Error("添加餐食记录失败")
    }

    return await response.json()
  },
}

// 营养分析数据管理
export const analyticsService = {
  // 获取营养分析数据
  async getAnalytics(timeframe: "本周" | "上周" | "本月" = "本周") {
    const session = await authService.getSession()
    if (!session?.access_token) {
      throw new Error("未登录")
    }

    const response = await fetch(`/api/analytics?timeframe=${timeframe}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error("获取营养分析数据失败")
    }

    return await response.json()
  },
}
