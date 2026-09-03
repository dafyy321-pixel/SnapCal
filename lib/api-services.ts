type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message?: string; code?: string }
}

export async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  let body: ApiEnvelope<T>
  try {
    body = await response.json()
  } catch {
    throw new Error(`服务器返回了无效响应 (${response.status})`)
  }
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error?.message || `请求失败 (${response.status})`)
  }
  return body.data
}

export const mealsService = {
  async getMealsByDate(date: string) {
    return requestData<{ profile: Record<string, unknown>; meals: unknown[] }>(
      `/api/meals?date=${encodeURIComponent(date)}&limit=1000`
    )
  },

  async addMeal(meal: Record<string, unknown>) {
    const data = await requestData<{ meal: Record<string, unknown> }>("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    })
    return data.meal
  },

  async getAllMeals<T = Record<string, unknown>>() {
    const meals: T[] = []
    const limit = 1000
    for (let offset = 0; ; offset += limit) {
      const data = await requestData<{ meals: T[]; pagination: { hasMore: boolean } }>(
        `/api/meals?limit=${limit}&offset=${offset}&sort_by=meal_date&sort_order=asc`
      )
      meals.push(...data.meals)
      if (!data.pagination.hasMore) return meals
    }
  },
}

export const analyticsService = {
  async getAnalytics(timeframe: "本周" | "上周" | "本月" = "本周") {
    return requestData(`/api/analytics?timeframe=${encodeURIComponent(timeframe)}`)
  },
}

export const profileService = {
  async getProfile<T = Record<string, unknown>>() {
    return requestData<{ profile: T }>("/api/profile").then(data => data.profile)
  },
  async updateProfile<T = Record<string, unknown>>(updates: Record<string, unknown>) {
    return requestData<{ profile: T }>("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(data => data.profile)
  },
}
