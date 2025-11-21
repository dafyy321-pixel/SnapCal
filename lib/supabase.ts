import { createClient } from "@supabase/supabase-js"
import { authManager } from "./auth-manager"
import { AppSession } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // 禁用自动刷新令牌避免刷新错误
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  // 添加全局错误处理和连接配置
  global: {
    headers: {
      'X-Client-Info': 'snapcal-web'
    },
    fetch: (url, options = {}) => {
      // 增加超时时间到30秒
      const timeout = 30000

      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })
      .catch((error) => {
        // 如果是超时错误，提供更友好的错误信息
        if (error.name === 'AbortError') {
          throw new Error('网络连接超时，请检查网络连接')
        }
        throw error
      })
    }
  }
})

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase Auth] 状态变化:', event, session?.user?.id ? `用户 ${session.user.id}` : '无用户')

  if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase Auth] 令牌已刷新')
  }

  if (event === 'SIGNED_OUT') {
    console.log('[Supabase Auth] 用户已退出登录')
    // 清理localStorage中的认证相关数据
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
    }
  }
})

// 用户登录状态管理 - 集成认证管理器
export const authService = {
  // 获取当前用户（使用认证管理器）
  async getCurrentUser() {
    try {
      return await authManager.getCurrentUser()
    } catch (err) {
      console.error('[Auth] 获取用户异常:', err)
      return null
    }
  },

  // 获取当前会话（使用认证管理器）
  async getSession() {
    try {
      console.log('[Auth] 开始获取会话...')
      const session = await authManager.getValidSession()
      console.log('[Auth] 获取会话结果:', session ? '成功' : '失败', session?.user?.id ? `用户ID: ${session.user.id}` : '')
      return session
    } catch (err) {
      console.error('[Auth] 获取会话异常:', err)
      return null
    }
  },

  // 获取有效的访问令牌
  async getValidAccessToken() {
    try {
      return await authManager.getValidAccessToken()
    } catch (err) {
      console.error('[Auth] 获取访问令牌异常:', err)
      return null
    }
  },

  // 检查是否已认证
  async isAuthenticated() {
    try {
      return await authManager.isAuthenticated()
    } catch (err) {
      console.error('[Auth] 认证检查异常:', err)
      return false
    }
  },

  // 退出登录（使用认证管理器）
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      // 清理认证管理器中的session
      authManager.clearSession()
      return { error }
    } catch (err) {
      console.error('[Auth] 退出登录异常:', err)
      return { error: err as Error }
    }
  },

  // 设置会话
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (!error && data.session) {
      // 将session保存到authManager的localStorage格式
      const appSession: AppSession = {
        user: data.session.user,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token!,
        expires_at: data.session.expires_at!,
        expires_in: data.session.expires_in!,
        token_type: data.session.token_type!
      }

      // 使用authManager的公共方法保存session
      authManager.saveSession(appSession)
      console.log('[Auth] Session已保存到localStorage')
    }

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

    const json = await response.json()
    // 后端使用统一 ApiResponse 格式：{ success, data: { profile, meals, ... }, error, ... }
    if (!json.success) {
      throw new Error(json.error?.message || "获取餐食记录失败")
    }

    // 始终返回 { profile, meals }，方便前端使用
    const data = json.data || {}
    return {
      profile: data.profile || {
        daily_calorie_goal: 1800,
        daily_protein_goal: 50,
        daily_carbs_goal: 30,
        daily_fats_goal: 20,
      },
      meals: data.meals || [],
    }
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
