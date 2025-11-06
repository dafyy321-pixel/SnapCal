"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Flame, Drumstick, Wheat, Droplet, Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AnalysisPage() {
  const router = useRouter()
  const [servings, setServings] = useState(1)
  const [foodData, setFoodData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Load analysis result from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setFoodData(data)
        sessionStorage.removeItem("analysisResult") // Clear after use
      } catch (error) {
        console.error("Failed to parse analysis result:", error)
      }
    }
    setLoading(false)
  }, [])

  // Fallback mock data if none available
  const defaultFoodData = {
    name: "未识别的食物",
    image: "https://via.placeholder.com/400x300?text=Food",
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
  }

  const displayData = foodData || defaultFoodData

  const handleSave = () => {
    // Save to daily log
    if (displayData) {
      // Store meal data
      const mealData = {
        ...displayData,
        servings: servings,
        recordedTime: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
      // In production, send this to backend
      console.log("Saving meal:", mealData)
    }
    router.push("/")
  }

  const adjustServings = (delta: number) => {
    setServings(Math.max(0.5, servings + delta))
  }

  const calculateValue = (base: number) => {
    return Math.round(base * servings * 10) / 10
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

        <div className="p-4 space-y-6">
          {/* Food Image - 完整显示食物图片 */}
          <Card className="overflow-hidden shadow-sm bg-gray-50">
            <img 
              src={displayData.image || "/placeholder.svg"} 
              alt={displayData.name} 
              className="w-full max-h-96 object-contain" 
            />
          </Card>

          {/* Food Name & Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{displayData.name}</h2>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                displayData.confidence >= 80 ? "bg-success/10 text-success" :
                displayData.confidence >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                "bg-orange-500/10 text-orange-600"
              }`}>
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">{displayData.confidence}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">AI 识别置信度</p>
          </div>

          {/* Serving Size Adjuster */}
          <Card className="p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">份量</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => adjustServings(-0.5)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold w-12 text-center">{servings}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => adjustServings(0.5)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Main Nutrition Card */}
          <Card className="p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-bold">{calculateValue(displayData.calories)}</div>
                <div className="text-sm text-muted-foreground">卡路里</div>
              </div>
            </div>

            {/* 三大营养素圆环图和数据 */}
            <div className="flex items-center gap-6">
              {/* 圆环图 */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    // 计算总热量（每克热量：蛋白质=4, 碳水=4, 脂肪=9）
                    const proteinCal = calculateValue(displayData.protein) * 4
                    const carbsCal = calculateValue(displayData.carbs) * 4
                    const fatsCal = calculateValue(displayData.fats) * 9
                    const totalCal = proteinCal + carbsCal + fatsCal

                    // 计算百分比
                    const proteinPercent = (proteinCal / totalCal) * 100
                    const carbsPercent = (carbsCal / totalCal) * 100
                    const fatsPercent = (fatsCal / totalCal) * 100

                    // 圆环参数
                    const radius = 40
                    const circumference = 2 * Math.PI * radius
                    
                    // 计算每个区段的长度和偏移
                    const proteinLength = (proteinPercent / 100) * circumference
                    const carbsLength = (carbsPercent / 100) * circumference
                    const fatsLength = (fatsPercent / 100) * circumference

                    return (
                      <>
                        {/* 蛋白质 */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={`${proteinLength} ${circumference}`}
                          strokeDashoffset="0"
                          className="text-protein"
                          strokeLinecap="round"
                        />
                        {/* 碳水化合物 */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={`${carbsLength} ${circumference}`}
                          strokeDashoffset={-proteinLength}
                          className="text-carbs"
                          strokeLinecap="round"
                        />
                        {/* 脂肪 */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={`${fatsLength} ${circumference}`}
                          strokeDashoffset={-(proteinLength + carbsLength)}
                          className="text-fats"
                          strokeLinecap="round"
                        />
                      </>
                    )
                  })()}
                </svg>
                {/* 中心文字 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">总热量</div>
                  </div>
                </div>
              </div>

              {/* 数据列表 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Drumstick className="w-4 h-4 text-protein" />
                    <span className="text-sm text-muted-foreground">蛋白质</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{calculateValue(displayData.protein)}g</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((calculateValue(displayData.protein) * 4 / calculateValue(displayData.calories)) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-carbs" />
                    <span className="text-sm text-muted-foreground">碳水</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{calculateValue(displayData.carbs)}g</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((calculateValue(displayData.carbs) * 4 / calculateValue(displayData.calories)) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-fats" />
                    <span className="text-sm text-muted-foreground">脂肪</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{calculateValue(displayData.fats)}g</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((calculateValue(displayData.fats) * 9 / calculateValue(displayData.calories)) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Nutrition Info - 动态显示 */}
          {displayData.nutrition && Object.keys(displayData.nutrition).length > 0 && (
            <Card className="p-4 shadow-sm">
              <h3 className="font-semibold mb-4">详细营养信息</h3>
              <div className="space-y-3">
                {Object.entries(displayData.nutrition).map(([key, value], index, array) => {
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
                  const isLast = index === array.length - 1

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between py-2 ${!isLast ? 'border-b border-border' : ''}`}
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="font-semibold">
                        {calculateValue(value as number)}
                        {unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Ingredients */}
          <Card className="p-4 shadow-sm">
            <h3 className="font-semibold mb-4">识别的食材</h3>
            <div className="flex flex-wrap gap-2">
              {displayData.ingredients && displayData.ingredients.map((ingredient: string, index: number) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                >
                  {ingredient}
                </div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full h-14 text-base" size="lg">
            <Check className="w-5 h-5 mr-2" />
            添加到今日记录
          </Button>
        </div>
      </div>
    </div>
  )
}
