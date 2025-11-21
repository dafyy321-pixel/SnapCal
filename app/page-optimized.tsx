"use client"

import { Flame, Drumstick, Wheat, Droplet, ArrowDown, AlertCircle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { FabButton } from "@/components/fab-button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, startOfWeek } from "date-fns"
import { Meal, UserProfile } from "@/types"
import { useFirstVisit } from "@/hooks/use-persistent-state"
import { AuthErrorHandler } from "@/lib/auth-error-handler"
import { useCachedMeals, useCachedProfile } from "@/hooks/use-cache"
import { CacheMonitor } from "@/components/cache-monitor"
import { authService } from "@/lib/supabase"

type MealItem = {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  image: string
}

type MealGroup = {
  mealType: string
  items: MealItem[]
}

type DailyData = {
  remainingCalories: number
  dailyGoal: number
  macros: Array<{
    name: string
    value: number
    goal: number
    status: "剩余" | "超过"
    progress: number
  }>
  mealGroups: MealGroup[]
}

export default function HomePageOptimized() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAchievements, setShowAchievements] = useState(false)
  const [currentEquivalent, setCurrentEquivalent] = useState(0)
  const [displayCalories, setDisplayCalories] = useState(0)
  const [dailyData, setDailyData] = useState<DailyData>({
    remainingCalories: 1800,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 0, goal: 50, status: "剩余", progress: 0 },
      { name: "碳水化合物", value: 0, goal: 30, status: "剩余", progress: 0 },
      { name: "脂肪", value: 0, goal: 20, status: "剩余", progress: 0 },
    ],
    mealGroups: [],
  })

  const { isFirstVisit, markAsVisited } = useFirstVisit()
  const [dataLoading, setDataLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 使用缓存hooks获取餐食和用户数据
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const {
    data: mealsData,
    loading: mealsLoading,
    error: mealsError,
    isValid: mealsValid,
    mutate: refetchMeals
  } = useCachedMeals(dateStr)

  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    isValid: profileValid
  } = useCachedProfile()

  const targetCalories = dailyData.remainingCalories

  const foodEquivalents = [
    "一个苹果🍎 + 一杯酸奶🥛",
    "一小碗米饭🍚",
    "半个牛油果🥑 + 一片全麦面包🍞",
    "两个鸡蛋🥚 + 一根香蕉🍌",
    "一杯豆浆🥛 + 一个橙子🍊",
  ]

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let session = await authService.getSession()
        if (!session) {
          console.log('[HomePage] 未找到有效 session，跳转到登录页')
          router.push("/auth")
          return
        }
        setLoading(false)
      } catch (error) {
        console.error("[HomePage] 检查登录状态错误:", error)
        router.push("/auth")
      }
    }
    checkAuth()
  }, [router])

  // 数据处理函数（使用缓存数据）
  const processData = useCallback(() => {
    if (!mealsValid || !profileValid) return

    const meals = mealsData?.meals || []
    const profile = profileData?.profile || profileData || {}
    const safeMeals = Array.isArray(meals) ? meals : []

    // 计算总营养
    const totalCalories = safeMeals.reduce((sum: number, meal: Meal) => sum + (meal.calories || 0), 0)
    const totalProtein = safeMeals.reduce((sum: number, meal: Meal) => sum + parseFloat(meal.protein?.toString() || '0'), 0)
    const totalCarbs = safeMeals.reduce((sum: number, meal: Meal) => sum + parseFloat(meal.carbs?.toString() || '0'), 0)
    const totalFats = safeMeals.reduce((sum: number, meal: Meal) => sum + parseFloat(meal.fats?.toString() || '0'), 0)

    const calorieGoal = profile?.daily_calorie_goal || 1800
    const proteinGoal = profile?.daily_protein_goal || 50
    const carbsGoal = profile?.daily_carbs_goal || 30
    const fatsGoal = profile?.daily_fats_goal || 20

    // 计算剩余量
    const remainingCalories = calorieGoal - totalCalories

    // 按餐食类型分组
    const mealGroups = safeMeals.reduce((groups: MealGroup[], meal) => {
      const mealType = meal.meal_type || 'other'

      const mealItem: MealItem = {
        id: meal.id,
        name: meal.meal_name,
        time: meal.meal_time ? new Date(meal.meal_time).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }) : '未知时间',
        calories: meal.calories || 0,
        protein: parseFloat(meal.protein?.toString() || '0'),
        carbs: parseFloat(meal.carbs?.toString() || '0'),
        fats: parseFloat(meal.fats?.toString() || '0'),
        image: meal.image_url || ''
      }

      const mealTypeMap = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '零食',
        other: '其他'
      }

      const mealTypeName = mealTypeMap[mealType as keyof typeof mealTypeMap] || '其他'
      const existingGroup = groups.find(g => g.mealType === mealTypeName)

      if (existingGroup) {
        existingGroup.items.push(mealItem)
      } else {
        groups.push({
          mealType: mealTypeName,
          items: [mealItem]
        })
      }
      return groups
    }, [])

    setDailyData({
      remainingCalories,
      dailyGoal: calorieGoal,
      macros: [
        {
          name: "蛋白质",
          value: totalProtein,
          goal: proteinGoal,
          status: totalProtein <= proteinGoal ? "剩余" : "超过",
          progress: Math.min((totalProtein / proteinGoal) * 100, 100)
        },
        {
          name: "碳水化合物",
          value: totalCarbs,
          goal: carbsGoal,
          status: totalCarbs <= carbsGoal ? "剩余" : "超过",
          progress: Math.min((totalCarbs / carbsGoal) * 100, 100)
        },
        {
          name: "脂肪",
          value: totalFats,
          goal: fatsGoal,
          status: totalFats <= fatsGoal ? "剩余" : "超过",
          progress: Math.min((totalFats / fatsGoal) * 100, 100)
        },
      ],
      mealGroups
    })

    setCurrentEquivalent(Math.floor(Math.abs(remainingCalories)))
  }, [mealsData, mealsValid, profileData, profileValid])

  // 监听缓存数据变化，自动更新UI
  useEffect(() => {
    processData()
  }, [processData])

  // 处理错误
  useEffect(() => {
    if (mealsError || profileError) {
      console.error("加载数据错误:", { mealsError, profileError })
      const authError = AuthErrorHandler.handleAuthError(mealsError || profileError)
      if (authError.shouldRedirect) {
        AuthErrorHandler.cleanupInvalidAuth()
        router.push('/auth?reason=session_expired')
      }
    }
  }, [mealsError, profileError, router])

  // 更新加载状态
  useEffect(() => {
    const isLoading = mealsLoading || profileLoading || loading
    if (isFirstVisit) {
      setDataLoading(isLoading)
    } else {
      setIsRefreshing(isLoading)
    }

    if (!isLoading && isFirstVisit) {
      markAsVisited()
    }
  }, [mealsLoading, profileLoading, loading, isFirstVisit, markAsVisited])

  // 卡路里数字动画
  useEffect(() => {
    let start = 0
    const duration = 1000
    const increment = targetCalories / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= targetCalories) {
        setDisplayCalories(targetCalories)
        clearInterval(timer)
      } else {
        setDisplayCalories(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [targetCalories])

  // 日期切换
  const changeDate = (days: number) => {
    setSelectedDate(prev => addDays(prev, days))
  }

  // 手动刷新
  const handleRefresh = () => {
    refetchMeals()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 md:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 md:bg-gray-200">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">今日营养</h1>
                <p className="text-sm text-gray-500">{format(selectedDate, "MM月dd日")}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={mealsLoading}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <ArrowDown className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* 日期选择器 */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => changeDate(-1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {format(selectedDate, "MM月dd日 EEEE")}
              </span>
              <button
                onClick={() => changeDate(1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4">
          {/* 卡路里圆形进度 */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-4 text-white">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <div className="text-4xl font-bold">{displayCalories}</div>
              </div>
              <h2 className="text-lg font-semibold mb-1">剩余卡路里</h2>
              <p className="text-sm opacity-90">
                约等于 {foodEquivalents[Math.floor(Math.random() * foodEquivalents.length)]}
              </p>
            </div>
          </div>

          {/* 营养素进度条 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {dailyData.macros.map((macro) => (
              <Card key={macro.name} className="p-3">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {macro.name === '蛋白质' && <Drumstick className="w-5 h-5 text-red-500 mr-1" />}
                    {macro.name === '碳水化合物' && <Wheat className="w-5 h-5 text-yellow-500 mr-1" />}
                    {macro.name === '脂肪' && <Droplet className="w-5 h-5 text-blue-500 mr-1" />}
                    <span className="text-xs text-gray-500">{macro.name}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {macro.value}g
                  </div>
                  <div className="text-xs text-gray-500">
                    目标 {macro.goal}g
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        macro.progress >= 100 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(macro.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 餐食列表 */}
          {dailyData.mealGroups.length > 0 ? (
            <div className="space-y-4">
              {dailyData.mealGroups.map((group, index) => (
                <Card key={index} className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{group.mealType}</h3>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.time}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{item.calories} kcal</div>
                          <div className="text-xs text-gray-500">
                            P{item.protein}g C{item.carbs}g F{item.fats}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <Flame className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">还没有餐食记录</h3>
              <p className="text-sm text-gray-500">
                点击右下角的拍照按钮开始记录
              </p>
            </Card>
          )}
        </div>

        {/* Floating Action Button */}
        <FabButton />

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Cache Monitor - 仅开发环境显示 */}
        <CacheMonitor />
      </div>
    </div>
  )
}