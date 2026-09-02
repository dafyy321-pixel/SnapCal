"use client"

import { useState, useEffect, Suspense } from "react"
import { ArrowLeft, Flame, Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { mealsService } from "@/lib/api-services"
import { FoodAnalysisData } from "@/types"
import { transformAnalysisData, validateAnalysisData } from "@/lib/data-transform"
import { FoodImage } from "@/components/optimized-image"
import { localDateParts } from "@/lib/date-utils"

function AnalysisPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')

  const [servings, setServings] = useState(1)
  const [foodData, setFoodData] = useState<FoodAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load analysis result from database using ID
  useEffect(() => {
    const loadAnalysisResult = async () => {
      if (!analysisId) {
        setError('缺少分析结果ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/analysis/${analysisId}`)

        if (!response.ok) {
          throw new Error('获取分析结果失败')
        }

        const result = await response.json()
        if (result.success && result.data) {
          // 使用数据转换函数处理API返回的数据
          const transformedData = transformAnalysisData(result.data)
          setFoodData(validateAnalysisData(transformedData))
        } else {
          setError(result.error?.message || '获取分析结果失败')
        }
      } catch (error) {
        console.error('Failed to load analysis result:', error)
        setError('加载分析结果失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysisResult()
  }, [analysisId])

  // Fallback mock data if none available - 使用validateAnalysisData确保类型正确
  const defaultFoodData = validateAnalysisData({
    name: "未识别的食物",
    image: "/placeholder.svg",
    confidence: 45,
    calories: 200,
    protein: 10,
    carbs: 25,
    fats: 8,
    ingredients: ["未识别的食材"],
    nutrition: {
      fiber: 2,
      sugar: 3,
      sodium: 200,
    },
  })

  const displayData = foodData || defaultFoodData

  const handleSave = async () => {
    if (!displayData || saving) return
    
    setSaving(true)
    try {
      const { date: mealDate, time: mealTime } = localDateParts()
      
      // 根据时间自动判断餐型（后端使用英文枚举：breakfast/lunch/dinner/snack）
      const getMealType = () => {
        const hour = Number(mealTime.slice(0, 2))
        if (hour >= 6 && hour < 10) return "breakfast"   // 早餐
        if (hour >= 10 && hour < 14) return "lunch"      // 午餐
        if (hour >= 14 && hour < 18) return "snack"      // 下午茶/加餐
        if (hour >= 18 && hour < 22) return "dinner"     // 晚餐
        return "snack"                                   // 宵夜按加餐处理
      }
      
      // 保存到数据库（包括完整营养信息）
      const nutritionData = displayData.nutrition || {}
      const meal = await mealsService.addMeal({
        meal_name: displayData.name,
        meal_type: getMealType(),
        meal_date: mealDate,
        meal_time: mealTime,
        calories: Math.round(calculateValue(displayData.calories)),
        protein: calculateValue(displayData.protein),
        carbs: calculateValue(displayData.carbs),
        fats: calculateValue(displayData.fats),
        image_url: displayData.image || undefined,
        // 详细营养信息
        fiber: nutritionData.fiber ? calculateValue(nutritionData.fiber) : undefined,
        sugar: nutritionData.sugar ? calculateValue(nutritionData.sugar) : undefined,
        sodium: nutritionData.sodium ? calculateValue(nutritionData.sodium) : undefined,
        calcium: nutritionData.calcium ? calculateValue(nutritionData.calcium) : undefined,
        vitamin_c: nutritionData.vitaminC ? calculateValue(nutritionData.vitaminC) : undefined,
        iron: nutritionData.iron ? calculateValue(nutritionData.iron) : undefined,
        cholesterol: nutritionData.cholesterol ? calculateValue(nutritionData.cholesterol) : undefined,
        saturated_fat: nutritionData.saturatedFat ? calculateValue(nutritionData.saturatedFat) : undefined,
        trans_fat: nutritionData.transFat ? calculateValue(nutritionData.transFat) : undefined,
        potassium: nutritionData.potassium ? calculateValue(nutritionData.potassium) : undefined,
        vitamin_a: nutritionData.vitaminA ? calculateValue(nutritionData.vitaminA) : undefined,
        vitamin_d: nutritionData.vitaminD ? calculateValue(nutritionData.vitaminD) : undefined,
        vitamin_e: nutritionData.vitaminE ? calculateValue(nutritionData.vitaminE) : undefined,
        ingredients: displayData.ingredients || undefined,
        confidence: displayData.confidence || undefined,
      })

      // 关联分析结果到餐食记录
      if (analysisId && meal?.id) {
        try {
          await fetch(`/api/analysis/${analysisId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meal_id: meal.id,
            }),
          })
        } catch (error) {
          console.error('Failed to link analysis to meal:', error)
          // 不影响主要功能，只记录错误
        }
      }
      
      // 成功后跳转到首页
      router.push("/")
    } catch (error) {
      console.error("保存餐食记录错误:", error)
      alert("保存失败，请重试")
      setSaving(false)
    }
  }

  const adjustServings = (delta: number) => {
    setServings(Math.min(3, Math.max(0.5, servings + delta)))
  }

  const calculateValue = (base: number) => {
    return Math.round(base * servings * 10) / 10
  }

  // 生成与"本周营养总览"一致的数据结构（按克数占比）
  const macroDistribution = (() => {
    const protein = calculateValue((displayData?.protein ?? 0))
    const carbs = calculateValue((displayData?.carbs ?? 0))
    const fats = calculateValue((displayData?.fats ?? 0))

    // 如果没有营养数据（都是0），显示均匀分布33.33%
    if (protein === 0 && carbs === 0 && fats === 0) {
      return [
        { name: "蛋白质", value: 0, color: "#e74c3c", percentage: "33.3" },
        { name: "碳水化合物", value: 0, color: "#f39c12", percentage: "33.3" },
        { name: "脂肪", value: 0, color: "#3498db", percentage: "33.4" }, // 33.4 确保总和为100%
      ]
    }

    const total = protein + carbs + fats
    return [
      { name: "蛋白质", value: protein, color: "#e74c3c", percentage: ((protein / total) * 100).toFixed(1) },
      { name: "碳水化合物", value: carbs, color: "#f39c12", percentage: ((carbs / total) * 100).toFixed(1) },
      { name: "脂肪", value: fats, color: "#3498db", percentage: ((fats / total) * 100).toFixed(1) },
    ]
  })()

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">❌</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">加载失败</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              重新加载
            </Button>
            <Button variant="outline" onClick={() => router.push('/scan')} className="w-full">
              重新扫描
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:bg-transparent">
      {/* 限制最大宽度，在大屏幕上居中显示 */}
      <div className="max-w-md mx-auto md:bg-background md:shadow-xl md:min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">营养分析</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Food Image - 完整显示食物图片 */}
          <Card className="overflow-hidden shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              <FoodImage
                src={displayData.image || "/placeholder.svg"}
                alt={displayData.name}
                width={400}
                height={300}
                foodName={displayData.name}
                priority={true}
                lazy={false}
                className="object-contain"
                containerClassName="w-full h-full"
              />
            </div>
          </Card>

          {/* Food Name & Confidence */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold leading-tight flex-1">{displayData.name}</h2>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 ${
                displayData.confidence >= 80 ? "bg-success/10 text-success" :
                displayData.confidence >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                "bg-orange-500/10 text-orange-600"
              }`}>
                <Check className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">{displayData.confidence}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">AI 识别置信度</p>
          </div>

          {/* Serving Size Adjuster */}
          <Card className="p-3.5 shadow-sm border border-border/50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">份量调整</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-accent"
                  onClick={() => adjustServings(-0.5)}
                  disabled={servings <= 0.5}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold w-14 text-center tabular-nums">{servings}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-accent"
                  onClick={() => adjustServings(0.5)}
                  disabled={servings >= 3}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Main Nutrition Card */}
          <Card className="p-5 shadow-md border-0 bg-gradient-to-br from-card to-muted/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center shadow-sm">
                <Flame className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <div className="text-4xl font-bold tracking-tight tabular-nums">{calculateValue(displayData.calories)}</div>
                <div className="text-sm text-muted-foreground font-medium">千卡 (kcal)</div>
              </div>
            </div>

            {/* 三大营养素分布（与“本周营养总览”一致风格） */}
            <div className="flex items-center gap-5">
              {/* 圆环图 */}
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

              {/* 右侧百分比列表 */}
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

          {/* Additional Nutrition Info - 动态显示 */}
          {displayData.nutrition && Object.keys(displayData.nutrition).length > 0 && (
            <Card className="p-4 shadow-sm border border-border/50">
              <h3 className="font-semibold text-base mb-3">详细营养信息</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(displayData.nutrition).map(([key, value]) => {
                  // 营养素名称映射
                  const nutritionLabels: Record<string, string> = {
                    fiber: '膨食纤维',
                    sugar: '糖',
                    sodium: '鈉',
                    calcium: '钙',
                    vitaminC: '维生素C',
                    iron: '铁',
                    cholesterol: '胆固醇',
                    saturatedFat: '饱和脂肪',
                    transFat: '反式脂肪',
                    potassium: '钾',
                    vitaminA: '维生素A',
                    vitaminD: '维生素D',
                    vitaminE: '维生素E',
                  }

                  // 单位映射
                  const nutritionUnits: Record<string, string> = {
                    sodium: 'mg',
                    calcium: 'mg',
                    vitaminC: 'mg',
                    iron: 'mg',
                    cholesterol: 'mg',
                    potassium: 'mg',
                    vitaminA: 'μg',
                    vitaminD: 'μg',
                    vitaminE: 'mg',
                  }

                  const label = nutritionLabels[key] || key
                  const unit = nutritionUnits[key] || 'g'

                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                    >
                      <span className="text-xs text-muted-foreground font-medium">{label}</span>
                      <span className="font-bold text-sm tabular-nums">
                        {calculateValue(value as number)}{unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Ingredients */}
          <Card className="p-4 shadow-sm border border-border/50">
            <h3 className="font-semibold text-base mb-3">识别的食材</h3>
            <div className="flex flex-wrap gap-2">
              {displayData.ingredients && displayData.ingredients.map((ingredient: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-gradient-to-r from-secondary to-muted text-secondary-foreground rounded-lg text-sm font-medium border border-border/30 shadow-sm"
                >
                  {ingredient}
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full h-12 text-base font-semibold shadow-lg" 
            size="lg"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                添加到今日记录
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <AnalysisPageContent />
    </Suspense>
  )
}
