"use client"

import { Apple, Flame, Drumstick, Wheat, Droplet, ArrowDown, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/bottom-nav"
import { FabButton } from "@/components/fab-button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const dailyData = {
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
  const [selectedDate, setSelectedDate] = useState(18)
  const [showAchievements, setShowAchievements] = useState(false)
  const [currentEquivalent, setCurrentEquivalent] = useState(0)
  const [displayCalories, setDisplayCalories] = useState(0)

  const currentData = dailyData[selectedDate as keyof typeof dailyData]
  const targetCalories = currentData.remainingCalories
  const dailyGoal = currentData.dailyGoal

  const foodEquivalents = [
    "一个苹果🍎 + 一杯酸奶🥛",
    "一小碗米饭🍚",
    "半个牛油果🥑 + 一片全麦面包🍞",
    "两个鸡蛋🥚 + 一根香蕉🍌",
    "一杯豆浆🥛 + 一个橙子🍊",
  ]

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

  const weekDays = [
    { day: "一", date: 13, active: selectedDate === 13, hasLogs: true, isFuture: false },
    { day: "二", date: 14, active: selectedDate === 14, hasLogs: true, isFuture: false },
    { day: "三", date: 15, active: selectedDate === 15, hasLogs: true, isFuture: false },
    { day: "四", date: 16, active: selectedDate === 16, hasLogs: true, isFuture: false },
    { day: "五", date: 17, active: selectedDate === 17, hasLogs: true, isFuture: false },
    { day: "六", date: 18, active: selectedDate === 18, hasLogs: true, isFuture: false },
    { day: "日", date: 19, active: selectedDate === 19, hasLogs: false, isFuture: true },
  ]

  const macros = currentData.macros.map((macro) => ({
    ...macro,
    icon: macro.name === "蛋白质" ? Drumstick : macro.name === "碳水化合物" ? Wheat : Droplet,
    color: macro.name === "蛋白质" ? "protein" : macro.name === "碳水化合物" ? "carbs" : "fats",
    baseColor: macro.name === "蛋白质" ? "text-protein" : macro.name === "碳水化合物" ? "text-carbs" : "text-fats",
    ringColor: macro.name === "蛋白质" ? "text-protein" : macro.name === "碳水化合物" ? "text-carbs" : "text-fats",
  }))

  const mealGroups = currentData.mealGroups

  const showEmptyState = mealGroups.length === 0 || mealGroups.every((group) => group.items.length === 0)

  const handleEquivalentClick = () => {
    setCurrentEquivalent((prev) => (prev + 1) % foodEquivalents.length)
  }

  const consumedCalories = dailyGoal - targetCalories
  const consumedPercentage = (consumedCalories / dailyGoal) * 100
  const isLowCalories = targetCalories < dailyGoal * 0.2
  const ringStrokeDashoffset = 251.2 - (251.2 * consumedPercentage) / 100

  return (
    <div className="min-h-screen bg-background pb-24 md:bg-transparent">
      {/* 限制最大宽度在移动设备尺寸，桌面上居中显示 */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:bg-background md:shadow-xl md:min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple className="w-8 h-8 fill-foreground" />
            <h1 className="text-2xl font-bold">Cal AI</h1>
          </div>
          <button
            onClick={() => setShowAchievements(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-card rounded-full shadow-sm hover:shadow-md transition-shadow active:scale-95 transition-transform"
          >
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">1</span>
          </button>
        </div>

        {/* Week Selector */}
        <div className="flex items-center justify-between gap-2">
          {weekDays.map((item, index) => (
            <button
              key={index}
              onClick={() => !item.isFuture && setSelectedDate(item.date)}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 relative transition-all",
                item.active && "text-success",
                item.isFuture && "opacity-40",
                !item.isFuture && "hover:scale-105 active:scale-95",
              )}
              disabled={item.isFuture}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                  item.active
                    ? "border-success bg-success/10"
                    : item.hasLogs && !item.isFuture
                      ? "border-muted-foreground/30 border-solid"
                      : "border-dashed border-muted-foreground/30",
                )}
              >
                {item.day}
              </div>
              <span className="text-xs font-medium">{item.date}</span>
              {item.hasLogs && !item.active && !item.isFuture && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
              )}
            </button>
          ))}
        </div>

        {/* Main Calorie Card */}
        <Card className="p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-5xl font-bold mb-1 tabular-nums">{displayCalories}</div>
              <div className="text-sm text-muted-foreground mb-1">剩余卡路里</div>
              <div className="text-xs text-muted-foreground/70 mb-1">目标: {dailyGoal} 大卡</div>
              <button
                onClick={handleEquivalentClick}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer text-left"
              >
                约等于: {foodEquivalents[currentEquivalent]}
              </button>
            </div>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={ringStrokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    isLowCalories ? "text-amber-500" : "text-foreground",
                  )}
                  style={{ transitionProperty: "stroke-dashoffset, stroke" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* Macronutrient Cards */}
        <div className="grid grid-cols-3 gap-3">
          {macros.map((macro, index) => {
            const Icon = macro.icon

            return (
              <Card key={index} className="p-4 shadow-sm relative">
                {macro.status === "超过" && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                )}

                <div className={cn("text-2xl font-bold mb-1 transition-colors duration-300", macro.baseColor)}>
                  {macro.value}g
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {macro.name} {macro.status}
                </div>
                <div className="relative w-16 h-16 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-muted/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * macro.progress) / 100}
                      strokeLinecap="round"
                      className={cn(macro.ringColor, "transition-all duration-700 ease-out")}
                      style={{ transitionProperty: "stroke-dashoffset, stroke" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={cn("w-5 h-5 transition-colors duration-300", macro.baseColor)} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Daily Food Log */}
        <div className="space-y-4">
          {showEmptyState ? (
            <Card className="p-8 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground/40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <path d="M12 14v7" />
                    <path d="M8 18h8" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">今天还未记录饮食哦</p>
                  <p className="text-sm text-muted-foreground">点击下方的相机开始吧！</p>
                </div>
                <ArrowDown className="w-5 h-5 text-muted-foreground/40 animate-bounce" />
              </div>
            </Card>
          ) : (
            mealGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <h2 className="text-base font-semibold px-1">{group.mealType}</h2>
                {group.items.map((meal, index) => (
                  <Card key={index} className="p-4 shadow-sm">
                    <div className="flex gap-4">
                      <img
                        src={meal.image || "/placeholder.svg"}
                        alt={meal.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm truncate">{meal.name}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{meal.time}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">{meal.calories} 卡路里</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Drumstick className="w-3.5 h-3.5 text-protein" />
                            <span>{meal.protein}g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wheat className="w-3.5 h-3.5 text-carbs" />
                            <span>{meal.carbs}g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-fats" />
                            <span>{meal.fats}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {showAchievements && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAchievements(false)}
        >
          <Card
            className="w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">我的成就</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-2xl">🔥</div>
                <div className="flex-1">
                  <h3 className="font-semibold">连续记录 1 天</h3>
                  <p className="text-xs text-muted-foreground">继续保持！</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-muted-foreground">连续记录 7 天</h3>
                  <p className="text-xs text-muted-foreground">还需 6 天</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
                  💪
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-muted-foreground">首次达成蛋白质目标</h3>
                  <p className="text-xs text-muted-foreground">还需 38g</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-muted">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl opacity-50">
                  🥗
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-muted-foreground">健康饮食一周</h3>
                  <p className="text-xs text-muted-foreground">保持营养均衡</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
      <FabButton />
    </div>
  )
}
