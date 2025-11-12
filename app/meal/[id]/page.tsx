"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Flame, Drumstick, Wheat, Droplet, Check, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { authService } from "@/lib/supabase"

export default function MealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const mealId = params.id as string

  const [meal, setMeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadMealDetail = async () => {
      try {
        const session = await authService.getSession()
        if (!session?.access_token) {
          router.push("/auth")
          return
        }

        const response = await fetch(`/api/meals/${mealId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error("获取餐食详情失败")
        }

        const result = await response.json()
        if (result.success) {
          setMeal(result.meal)
        }
      } catch (error) {
        console.error("加载餐食详情错误:", error)
        alert("加载失败")
        router.back()
      } finally {
        setLoading(false)
      }
    }

    loadMealDetail()
  }, [mealId, router])

  const handleDelete = async () => {
    if (!confirm("确定要删除这条餐食记录吗？")) return

    setDeleting(true)
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
        throw new Error("删除失败")
      }

      alert("删除成功")
      router.push("/")
    } catch (error) {
      console.error("删除餐食错误:", error)
      alert("删除失败，请重试")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!meal) {
    return null
  }

  // 计算三大营养素分布
  const protein = parseFloat(meal.protein) || 0
  const carbs = parseFloat(meal.carbs) || 0
  const fats = parseFloat(meal.fats) || 0
  const total = Math.max(protein + carbs + fats, 1)

  const macroDistribution = [
    { name: "蛋白质", value: protein, color: "#e74c3c", percentage: ((protein / total) * 100).toFixed(1) },
    { name: "碳水化合物", value: carbs, color: "#f39c12", percentage: ((carbs / total) * 100).toFixed(1) },
    { name: "脂肪", value: fats, color: "#3498db", percentage: ((fats / total) * 100).toFixed(1) },
  ]

  // 营养素名称映射
  const nutritionLabels: Record<string, string> = {
    fiber: '膳食纤维',
    sugar: '糖',
    sodium: '钠',
    calcium: '钙',
    vitamin_c: '维生素C',
    iron: '铁',
    cholesterol: '胆固醇',
    saturated_fat: '饱和脂肪',
    trans_fat: '反式脂肪',
    potassium: '钾',
    vitamin_a: '维生素A',
    vitamin_d: '维生素D',
    vitamin_e: '维生素E',
  }

  // 单位映射
  const nutritionUnits: Record<string, string> = {
    sodium: 'mg',
    calcium: 'mg',
    vitamin_c: 'mg',
    iron: 'mg',
    cholesterol: 'mg',
    potassium: 'mg',
    vitamin_a: 'μg',
    vitamin_d: 'μg',
    vitamin_e: 'mg',
  }

  // 获取有值的详细营养信息
  const detailedNutrition = Object.keys(nutritionLabels)
    .filter(key => meal[key] && parseFloat(meal[key]) > 0)
    .map(key => ({
      key,
      label: nutritionLabels[key],
      value: parseFloat(meal[key]),
      unit: nutritionUnits[key] || 'g'
    }))

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? '下午' : '上午'
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${period}${displayHour}:${minutes}`
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">餐食详情</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Food Image */}
          {meal.image_url && (
            <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src={meal.image_url}
                alt={meal.meal_name}
                className="w-full max-h-80 object-contain p-2"
              />
            </Card>
          )}

          {/* Food Name & Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold leading-tight">{meal.meal_name}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>{meal.meal_type}</span>
                  <span>•</span>
                  <span>{formatTime(meal.meal_time)}</span>
                </div>
              </div>
              {meal.confidence > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 ${
                  meal.confidence >= 80 ? "bg-success/10 text-success" :
                  meal.confidence >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                  "bg-orange-500/10 text-orange-600"
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{meal.confidence}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Nutrition Card */}
          <Card className="p-5 shadow-md border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center shadow-sm">
                <Flame className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <div className="text-4xl font-bold tracking-tight tabular-nums">{meal.calories}</div>
                <div className="text-sm text-muted-foreground font-medium">千卡 (kcal)</div>
              </div>
            </div>

            {/* 三大营养素分布 */}
            <div className="flex items-center gap-5">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroDistribution} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={2} dataKey="value">
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2.5">
                {macroDistribution.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: m.color }} />
                      <span className="text-sm text-muted-foreground font-medium">{m.name}</span>
                    </div>
                    <div className="text-sm font-bold tabular-nums">
                      {m.value}g <span className="text-xs text-muted-foreground font-medium">({m.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Detailed Nutrition Info */}
          {detailedNutrition.length > 0 && (
            <Card className="p-4 shadow-sm border border-border/50">
              <h3 className="font-semibold text-base mb-3">详细营养信息</h3>
              <div className="grid grid-cols-2 gap-3">
                {detailedNutrition.map(({ key, label, value, unit }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    <span className="font-bold text-sm tabular-nums">
                      {value}{unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <Card className="p-4 shadow-sm border border-border/50">
              <h3 className="font-semibold text-base mb-3">识别的食材</h3>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ingredient: string, index: number) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-gradient-to-r from-secondary to-muted text-secondary-foreground rounded-lg text-sm font-medium border border-border/30 shadow-sm"
                  >
                    {ingredient}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
