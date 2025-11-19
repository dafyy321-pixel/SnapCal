import useSWR from 'swr'
import { authService } from './supabase'

// 通用的fetcher函数
async function fetcher(url: string) {
  const session = await authService.getSession()
  if (!session?.access_token) {
    throw new Error('未登录')
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('请求失败')
  }

  return response.json()
}

// 获取指定日期的餐食数据
export function useMeals(date: string) {
  const { data, error, isLoading, mutate } = useSWR(
    date ? `/api/meals?date=${date}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // 窗口聚焦时不重新验证
      revalidateOnReconnect: true, // 网络重连时重新验证
      dedupingInterval: 5000, // 5秒内相同请求去重
      keepPreviousData: true, // 切换日期时保持旧数据
    }
  )

  return {
    meals: data?.meals || [],
    profile: data?.profile || {},
    isLoading,
    isError: error,
    mutate, // 用于手动刷新数据
  }
}

// 获取营养分析数据
export function useAnalytics(timeframe: '本周' | '上周' | '本月' = '本周') {
  const { data, error, isLoading } = useSWR(
    `/api/analytics?timeframe=${timeframe}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10秒去重
      keepPreviousData: true,
    }
  )

  return {
    stats: data?.stats || {},
    dailyData: data?.dailyData || [],
    dailyCalorieGoal: data?.dailyCalorieGoal || 1800,
    isLoading,
    isError: error,
  }
}
