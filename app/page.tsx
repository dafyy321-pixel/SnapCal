"use client"

import { Flame, Drumstick, Wheat, Droplet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ListSkeleton } from "@/components/ui/skeleton"
import { BottomNav } from "@/components/bottom-nav"
import { FabButton } from "@/components/fab-button"
import { OptimizedImage } from "@/components/optimized-image"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { mealsService, authService } from "@/lib/supabase"
import { format, addDays, startOfWeek } from "date-fns"
import { WeekSelector } from "@/components/home-page/week-selector"
import { CalorieCard } from "@/components/home-page/calorie-card"
import { MacronutrientCards } from "@/components/home-page/macronutrient-cards"
import { MealItem } from "@/components/home-page/meal-item"
import { EmptyState } from "@/components/home-page/empty-state"
import { AchievementsModal } from "@/components/home-page/achievements-modal"

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

// 保留作为演示数据（可选）
const dailyData_backup = {
  13: {
    remainingCalories: 450,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 35, goal: 50, status: "剩余" as const, progress: 70 },
      { name: "碳水化合物", value: 25, goal: 30, status: "剩余" as const, progress: 83 },
      { name: "脂肪", value: 15, goal: 20, status: "剩余" as const, progress: 75 },
    ],
    mealGroups: [
      {
        mealType: "早餐",
        items: [
          {
            name: "燕麦粥",
            time: "上午8:30",
            calories: 280,
            protein: 12,
            carbs: 45,
            fats: 6,
            image: "/bowl-of-oatmeal.png",
          },
        ],
      },
      {
        mealType: "午餐",
        items: [
          {
            name: "鸡胸肉沙拉",
            time: "下午12:45",
            calories: 420,
            protein: 38,
            carbs: 25,
            fats: 18,
            image: "/creamy-chicken-salad.png",
          },
        ],
      },
    ],
  },
  14: {
    remainingCalories: 320,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 28, goal: 50, status: "剩余" as const, progress: 56 },
      { name: "碳水化合物", value: 38, goal: 30, status: "超过" as const, progress: 100 },
      { name: "脂肪", value: 18, goal: 20, status: "剩余" as const, progress: 90 },
    ],
    mealGroups: [
      {
        mealType: "早餐",
        items: [
          {
            name: "全麦三明治",
            time: "上午7:45",
            calories: 350,
            protein: 18,
            carbs: 42,
            fats: 12,
            image: "/classic-sandwich.png",
          },
        ],
      },
      {
        mealType: "午餐",
        items: [
          {
            name: "意大利面",
            time: "下午1:15",
            calories: 520,
            protein: 22,
            carbs: 68,
            fats: 15,
            image: "/colorful-pasta-arrangement.png",
          },
        ],
      },
      {
        mealType: "晚餐",
        items: [
          {
            name: "烤三文鱼",
            time: "下午7:30",
            calories: 380,
            protein: 35,
            carbs: 8,
            fats: 22,
            image: "/fresh-salmon-fillet.png",
          },
        ],
      },
    ],
  },
  15: {
    remainingCalories: 580,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 42, goal: 50, status: "剩余" as const, progress: 84 },
      { name: "碳水化合物", value: 22, goal: 30, status: "剩余" as const, progress: 73 },
      { name: "脂肪", value: 12, goal: 20, status: "剩余" as const, progress: 60 },
    ],
    mealGroups: [
      {
        mealType: "早餐",
        items: [
          {
            name: "希腊酸奶配水果",
            time: "上午8:00",
            calories: 220,
            protein: 18,
            carbs: 28,
            fats: 5,
            image: "/creamy-yogurt-bowl.png",
          },
        ],
      },
      {
        mealType: "午餐",
        items: [
          {
            name: "牛肉炒饭",
            time: "下午12:30",
            calories: 480,
            protein: 32,
            carbs: 55,
            fats: 15,
            image: "/fried-rice.png",
          },
        ],
      },
    ],
  },
  16: {
    remainingCalories: 280,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 22, goal: 50, status: "剩余" as const, progress: 44 },
      { name: "碳水化合物", value: 45, goal: 30, status: "超过" as const, progress: 100 },
      { name: "脂肪", value: 25, goal: 20, status: "超过" as const, progress: 100 },
    ],
    mealGroups: [
      {
        mealType: "早餐",
        items: [
          {
            name: "煎饼果子",
            time: "上午8:15",
            calories: 420,
            protein: 15,
            carbs: 52,
            fats: 18,
            image: "/pancake.jpg",
          },
        ],
      },
      {
        mealType: "午餐",
        items: [
          {
            name: "汉堡套餐",
            time: "下午1:00",
            calories: 780,
            protein: 28,
            carbs: 75,
            fats: 38,
            image: "/classic-beef-burger.png",
          },
        ],
      },
      {
        mealType: "晚餐",
        items: [
          {
            name: "蔬菜汤",
            time: "下午7:00",
            calories: 180,
            protein: 8,
            carbs: 22,
            fats: 6,
            image: "/bowl-of-comforting-soup.png",
          },
        ],
      },
    ],
  },
  17: {
    remainingCalories: 390,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 38, goal: 50, status: "剩余" as const, progress: 76 },
      { name: "碳水化合物", value: 28, goal: 30, status: "剩余" as const, progress: 93 },
      { name: "脂肪", value: 16, goal: 20, status: "剩余" as const, progress: 80 },
    ],
    mealGroups: [
      {
        mealType: "早餐",
        items: [
          {
            name: "鸡蛋吐司",
            time: "上午7:30",
            calories: 320,
            protein: 22,
            carbs: 35,
            fats: 10,
            image: "/eggs-toast.jpg",
          },
        ],
      },
      {
        mealType: "午餐",
        items: [
          {
            name: "寿司拼盘",
            time: "下午12:45",
            calories: 450,
            protein: 28,
            carbs: 58,
            fats: 12,
            image: "/assorted-sushi-platter.png",
          },
        ],
      },
      {
        mealType: "晚餐",
        items: [
          {
            name: "烤鸡腿",
            time: "下午7:15",
            calories: 380,
            protein: 35,
            carbs: 12,
            fats: 20,
            image: "/roasted-chicken-leg.png",
          },
        ],
      },
    ],
  },
  18: {
    remainingCalories: 222,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 12, goal: 50, status: "剩余" as const, progress: 24 },
      { name: "碳水化合物", value: 43, goal: 30, status: "超过" as const, progress: 100 },
      { name: "脂肪", value: 28, goal: 20, status: "超过" as const, progress: 100 },
    ],
    mealGroups: [
      {
        mealType: "晚餐",
        items: [
          {
            name: "乌冬面配料",
            time: "下午7:21",
            calories: 320,
            protein: 18,
            carbs: 40,
            fats: 12,
            image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yTrrnClCSmJ8dGMFgnKe7F4689HIT3.png",
          },
          {
            name: "炒蘑菇",
            time: "下午7:18",
            calories: 22,
            protein: 3,
            carbs: 3,
            fats: 1,
            image: "/sauteed-mushrooms.jpg",
          },
        ],
      },
    ],
  },
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAchievements, setShowAchievements] = useState(false)
  const [currentEquivalent, setCurrentEquivalent] = useState(0)
  const [displayCalories, setDisplayCalories] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(1800)
  const [dailyData, setDailyData] = useState<DailyData>({
    remainingCalories: 1800,
    dailyGoal: 1800,
    macros: [
      { name: "蛋白质", value: 50, goal: 50, status: "剩余", progress: 0 },
      { name: "碳水化合物", value: 30, goal: 30, status: "剩余", progress: 0 },
      { name: "脂肪", value: 20, goal: 20, status: "剩余", progress: 0 },
    ],
    mealGroups: [],
  })
  const [refreshKey, setRefreshKey] = useState(0) // 用于触发刷新
  const [dataLoading, setDataLoading] = useState(false) // 数据加载状态
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    // 从 sessionStorage 读取，如果已经加载过则不再显示骨架屏
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('hasLoadedOnce')
    }
    return true
  })
  const [isRefreshing, setIsRefreshing] = useState(false) // 切换日期加载
  const [dataCache, setDataCache] = useState<{[key: string]: any}>({}) // 简单缓存
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date()) // 当前显示的周起始日期

  const targetCalories = dailyData.remainingCalories

  // 使用 useMemo 优化常量数组和计算
  const foodEquivalents = useMemo(() => [
    "一个苹果🍎 + 一杯酸奶🥛",
    "一小碗米饭🍚",
    "半个牛油果🥑 + 一片全麦面包🍞",
    "两个鸡蛋🥚 + 一根香蕉🍌",
    "一杯豆浆🥛 + 一个橙子🍊",
  ], [])

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getSession()
        if (!session) {
          router.push("/auth")
          return
        }
        setLoading(false)
      } catch (error) {
        console.error("检查登录状态错误:", error)
        router.push("/auth")
      }
    }
    checkAuth()
  }, [])

  // 数据处理函数（提取出来复用）
  const processData = useCallback((result: any) => {
    const { profile, meals } = result || {}
    const safeMeals = Array.isArray(meals) ? meals : []
    
    // 计算总营养
    const totalCalories = safeMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0)
    const totalProtein = safeMeals.reduce((sum: number, meal: any) => sum + parseFloat(meal.protein || 0), 0)
    const totalCarbs = safeMeals.reduce((sum: number, meal: any) => sum + parseFloat(meal.carbs || 0), 0)
    const totalFats = safeMeals.reduce((sum: number, meal: any) => sum + parseFloat(meal.fats || 0), 0)
    
    const calorieGoal = profile.daily_calorie_goal || 1800
    const proteinGoal = profile.daily_protein_goal || 50
    const carbsGoal = profile.daily_carbs_goal || 30
    const fatsGoal = profile.daily_fats_goal || 20
    
    // 按餐型分组
    const mealsByType: { [key: string]: any[] } = {}
    safeMeals.forEach((meal: any) => {
      const type = meal.meal_type || "其他"
      if (!mealsByType[type]) {
        mealsByType[type] = []
      }
      // 格式化时间显示
      const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const period = hour >= 12 ? '下午' : '上午'
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
        return `${period}${displayHour}:${minutes}`
      }
      
      mealsByType[type].push({
        id: meal.id,
        name: meal.meal_name,
        time: formatTime(meal.meal_time),
        calories: meal.calories,
        protein: parseFloat(meal.protein),
        carbs: parseFloat(meal.carbs),
        fats: parseFloat(meal.fats),
        image: meal.image_url || "/placeholder.svg",
      })
    })
    
    const mealGroups = Object.keys(mealsByType).map(type => ({
      mealType: type,
      items: mealsByType[type],
    }))
    
    // 计算剩余和进度
    const remainingCalories = Math.max(0, calorieGoal - totalCalories)
    const remainingProtein = proteinGoal - totalProtein
    const remainingCarbs = carbsGoal - totalCarbs
    const remainingFats = fatsGoal - totalFats
    
    setDailyGoal(calorieGoal)
    setDailyData({
      remainingCalories,
      dailyGoal: calorieGoal,
      macros: [
        {
          name: "蛋白质",
          value: Math.round(Math.abs(remainingProtein)),
          goal: proteinGoal,
          status: remainingProtein >= 0 ? "剩余" : "超过",
          progress: Math.min(100, (totalProtein / proteinGoal) * 100),
        },
        {
          name: "碳水化合物",
          value: Math.round(Math.abs(remainingCarbs)),
          goal: carbsGoal,
          status: remainingCarbs >= 0 ? "剩余" : "超过",
          progress: Math.min(100, (totalCarbs / carbsGoal) * 100),
        },
        {
          name: "脂肪",
          value: Math.round(Math.abs(remainingFats)),
          goal: fatsGoal,
          status: remainingFats >= 0 ? "剩余" : "超过",
          progress: Math.min(100, (totalFats / fatsGoal) * 100),
        },
      ],
      mealGroups,
    })
  }, [])

  // 页面重新可见时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时刷新
        setRefreshKey(prev => prev + 1)
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  // 加载指定日期的餐食数据
  useEffect(() => {
    const loadMeals = async () => {
      if (loading) return
      
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      
      // 检查缓存
      if (dataCache[dateStr]) {
        processData(dataCache[dateStr])
        return
      }
      
      // 只有首次加载才显示骨架屏，切换日期显示轻量加载
      if (isInitialLoad) {
        setDataLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      try {
        const result = await mealsService.getMealsByDate(dateStr)
        
        // mealsService 已经保证抛出错误时不会返回，这里直接处理结果即可
        processData(result)
        // 保存到缓存
        setDataCache(prev => ({
          ...prev,
          [dateStr]: result
        }))
      } catch (error) {
        console.error("加载餐食数据错误:", error)
      } finally {
        setDataLoading(false)
        setIsRefreshing(false)
        if (isInitialLoad) {
          setIsInitialLoad(false)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasLoadedOnce', 'true')
          }
        }
      }
    }
    
    loadMeals()
  }, [selectedDate, loading, router, refreshKey, processData, isInitialLoad])

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
  }, [targetCalories, selectedDate])

  // 使用 useCallback 优化日期选择和导航函数
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }, [])

  const goToNextWeek = useCallback(() => {
    const nextWeek = addDays(currentWeekStart, 7)
    const today = new Date()
    // 不能超过当前周
    if (startOfWeek(nextWeek, { weekStartsOn: 1 }) <= startOfWeek(today, { weekStartsOn: 1 })) {
      setCurrentWeekStart(nextWeek)
    }
  }, [currentWeekStart])

  // 使用 useMemo 优化周状态检查
  const isCurrentWeek = useMemo(() => {
    const today = new Date()
    return format(startOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd") ===
           format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  }, [currentWeekStart])

  // 优化餐食点击处理
  const handleMealClick = useCallback((mealId: string) => {
    router.push(`/meal/${mealId}`)
  }, [router])

  // 使用 useMemo 优化数据计算
  const macros = useMemo(() =>
    dailyData.macros.map((macro) => ({
      ...macro,
      icon: macro.name === "蛋白质" ? Drumstick : macro.name === "碳水化合物" ? Wheat : Droplet,
      color: macro.name === "蛋白质" ? "protein" : macro.name === "碳水化合物" ? "carbs" : "fats",
      baseColor: macro.name === "蛋白质" ? "text-protein" : macro.name === "碳水化合物" ? "text-carbs" : "text-fats",
      ringColor: macro.name === "蛋白质" ? "text-protein" : macro.name === "碳水化合物" ? "text-carbs" : "text-fats",
    })), [dailyData.macros]
  )

  const mealGroups = useMemo(() => dailyData.mealGroups, [dailyData.mealGroups])

  const showEmptyState = useMemo(() =>
    mealGroups.length === 0 || mealGroups.every((group) => group.items.length === 0),
    [mealGroups]
  )

  // 使用 useCallback 优化事件处理函数
  const handleEquivalentClick = useCallback(() => {
    setCurrentEquivalent((prev) => (prev + 1) % foodEquivalents.length)
  }, [foodEquivalents.length])

  // 使用 useCallback 优化删除餐食记录函数
  const handleDeleteMeal = useCallback(async (mealId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡到卡片点击

    if (!confirm("确定要删除这条餐食记录吗？")) return

    try {
      const session = await authService.getSession()
      if (!session?.access_token) {
        router.push("/auth")
        return
      }

      const response = await fetch(`/api/meals/${mealId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        // 如果后端返回 404，视为已经被删除，前端直接刷新列表，不再弹错误
        if (response.status === 404) {
          console.warn("删除API：记录不存在或已删除，视为成功")
          setRefreshKey(prev => prev + 1)
          setDataCache({})
          return
        }

        let errorMessage = "删除失败"
        try {
          const errorData = await response.json()
          console.error("删除API错误:", errorData)
          // 后端统一错误格式：{ success: false, error: { message, code, ... } }
          errorMessage = errorData?.error?.message || errorData?.data?.error || errorMessage
        } catch (e) {
          console.error("解析删除API错误响应失败:", e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      if (result.success) {
        // 删除成功后刷新数据
        setRefreshKey(prev => prev + 1)
        // 清空缓存
        setDataCache({})
      }
    } catch (error) {
      console.error("删除餐食错误:", error)
      alert("删除失败：" + (error instanceof Error ? error.message : "请重试"))
    }
  }, [router])

  const consumedCalories = dailyGoal - targetCalories
  const consumedPercentage = (consumedCalories / dailyGoal) * 100
  const isLowCalories = targetCalories < dailyGoal * 0.2
  const ringStrokeDashoffset = 251.2 - (251.2 * consumedPercentage) / 100

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 渐变流动进度条 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-50/40 via-orange-50/40 to-amber-50/40 z-50 overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-full shadow-lg shadow-amber-500/50"
            style={{
              width: '40%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              filter: 'blur(0.5px)',
            }}
          />
        </div>
      )}
      
      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
      
      {/* 限制最大宽度在移动设备尺寸，桌面上居中显示 */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OptimizedImage
              src="/logo.png"
              alt="SnapCal"
              width={32}
              height={32}
              className="object-contain"
              priority={true}
              lazy={false}
            />
            <h1 className="text-2xl font-bold">SnapCal</h1>
          </div>
          <button
            onClick={() => setShowAchievements(true)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 bg-card rounded-full shadow-sm hover:shadow-md transition-all touch-feedback",
              isRefreshing && "ring-2 ring-amber-400/50 shadow-amber-200"
            )}
          >
            <Flame 
              className={cn(
                "w-5 h-5 text-amber-500 transition-all",
                isRefreshing && "animate-pulse scale-110"
              )} 
            />
            <span className="font-semibold">1</span>
          </button>
        </div>

        {/* Week Selector */}
        <WeekSelector
          selectedDate={selectedDate}
          currentWeekStart={currentWeekStart}
          onDateSelect={handleDateSelect}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          isCurrentWeek={isCurrentWeek}
        />

        {/* Main Calorie Card */}
        <CalorieCard
          displayCalories={displayCalories}
          targetCalories={targetCalories}
          dailyGoal={dailyGoal}
          dataLoading={dataLoading}
          currentEquivalent={currentEquivalent}
          foodEquivalents={foodEquivalents}
          onEquivalentClick={handleEquivalentClick}
        />

        {/* Macronutrient Cards */}
        <MacronutrientCards
          macros={macros}
          dataLoading={dataLoading}
        />

        {/* Daily Food Log */}
        <div className="space-y-4">
          {dataLoading ? (
            // 使用优化后的骨架屏
            <ListSkeleton items={2} showImage animate={true} />
          ) : showEmptyState ? (
            <EmptyState />
          ) : (
            mealGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <h2 className="text-base font-semibold px-1">{group.mealType}</h2>
                {group.items.map((meal, index) => (
                  <MealItem
                    key={index}
                    meal={meal}
                    onDelete={handleDeleteMeal}
                    onItemClick={handleMealClick}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
      <FabButton />

      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </div>
  )
}
