"use client"

import { ArrowLeft, Dumbbell, Target, Save, Plus, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { profileService } from "@/lib/api-services"

type GoalProfile = {
  height: number
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fats_goal: number
  weight: number
  target_weight: number
  weekly_goal: number
  activity_level: string
  weight_goal: string
  training_days_goal: number
  training_experience: "beginner" | "intermediate" | "advanced"
  available_equipment: string[]
  dietary_preferences: string[]
  allergies: string[]
}

function commaList(value: string) {
  return value.split(/[,，]/).map(item => item.trim()).filter(Boolean)
}

export default function GoalsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState({
    dailyCalories: 1800,
    protein: 50,
    carbs: 250,
    fats: 65,
    weight: 65,
    targetWeight: 60,
    weeklyGoal: 0.5, // 每周减重目标(kg)
    activityLevel: "moderate", // low, moderate, high
    weightGoal: "lose", // lose, maintain, gain
    trainingDaysGoal: 3,
    trainingExperience: "beginner" as GoalProfile["training_experience"],
    availableEquipment: "",
    dietaryPreferences: "",
    allergies: "",
  })
  const [height, setHeight] = useState(170)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const profile = await profileService.getProfile<GoalProfile>()
        setHeight(Number(profile.height) || 170)
        setGoals(previous => ({
          ...previous,
          dailyCalories: Number(profile.daily_calorie_goal) || 1800,
          protein: Number(profile.daily_protein_goal) || 50,
          carbs: Number(profile.daily_carbs_goal) || 250,
          fats: Number(profile.daily_fats_goal) || 65,
          weight: Number(profile.weight) || 65,
          targetWeight: Number(profile.target_weight) || 60,
          weeklyGoal: Number.isFinite(Number(profile.weekly_goal)) ? Number(profile.weekly_goal) : 0.5,
          activityLevel: ["low", "moderate", "high"].includes(String(profile.activity_level)) ? String(profile.activity_level) : "moderate",
          weightGoal: ["lose", "maintain", "gain"].includes(String(profile.weight_goal)) ? String(profile.weight_goal) : "maintain",
          trainingDaysGoal: profile.training_days_goal || 3,
          trainingExperience: profile.training_experience || "beginner",
          availableEquipment: profile.available_equipment.join("、"),
          dietaryPreferences: profile.dietary_preferences.join("、"),
          allergies: profile.allergies.join("、"),
        }))
      } catch (error) {
        setError(error instanceof Error ? error.message : "加载失败")
      }
    }
    void loadGoals()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await profileService.updateProfile({
        daily_calorie_goal: goals.dailyCalories,
        daily_protein_goal: goals.protein,
        daily_carbs_goal: goals.carbs,
        daily_fats_goal: goals.fats,
        weight: goals.weight,
        target_weight: goals.targetWeight,
        weekly_goal: goals.weeklyGoal,
        activity_level: goals.activityLevel,
        weight_goal: goals.weightGoal,
        training_days_goal: goals.trainingDaysGoal,
        training_experience: goals.trainingExperience,
        available_equipment: commaList(goals.availableEquipment),
        dietary_preferences: commaList(goals.dietaryPreferences),
        allergies: commaList(goals.allergies),
      })
      router.push("/profile")
    } catch (error) {
      console.error("保存失败:", error)
      setError(error instanceof Error ? error.message : "保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const calculateBMI = () => {
    const weight = goals.weight
    return (weight / ((height / 100) ** 2)).toFixed(1)
  }

  const getWeightGoalText = () => {
    switch (goals.weightGoal) {
      case "lose": return "减重"
      case "maintain": return "保持"
      case "gain": return "增重"
      default: return "保持"
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* 顶部导航栏 */}
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-12 pb-6 px-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <button
              aria-label="返回"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">目标设置</h1>
            <Button
              aria-label="保存目标"
              onClick={handleSave}
              disabled={loading}
              className="w-10 h-10 rounded-full"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {/* 每日营养目标 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
              <Target className="w-5 h-5 mr-2 text-primary" />
              每日营养目标
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">卡路里</label>
                  <span className="text-lg font-semibold text-primary">{goals.dailyCalories} kcal</span>
                </div>
                <Slider
                  aria-label="每日卡路里目标"
                  value={[goals.dailyCalories]}
                  onValueChange={(value) => setGoals(prev => ({ ...prev, dailyCalories: value[0] }))}
                  min={1200}
                  max={4000}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1200</span>
                  <span>4000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">蛋白质</label>
                  <span className="text-lg font-semibold text-green-600">{goals.protein}g</span>
                </div>
                <Slider
                  aria-label="每日蛋白质目标"
                  value={[goals.protein]}
                  onValueChange={(value) => setGoals(prev => ({ ...prev, protein: value[0] }))}
                  min={30}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">碳水化合物</label>
                  <span className="text-lg font-semibold text-orange-600">{goals.carbs}g</span>
                </div>
                <Slider
                  aria-label="每日碳水目标"
                  value={[goals.carbs]}
                  onValueChange={(value) => setGoals(prev => ({ ...prev, carbs: value[0] }))}
                  min={100}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">脂肪</label>
                  <span className="text-lg font-semibold text-purple-600">{goals.fats}g</span>
                </div>
                <Slider
                  aria-label="每日脂肪目标"
                  value={[goals.fats]}
                  onValueChange={(value) => setGoals(prev => ({ ...prev, fats: value[0] }))}
                  min={20}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* 体重管理 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">体重管理</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="current-weight" className="text-sm font-medium text-muted-foreground mb-2 block">当前体重 (kg)</label>
                <div className="flex items-center gap-3">
                  <Button
                    aria-label="减少当前体重"
                    variant="outline"
                    size="icon"
                     onClick={() => setGoals(prev => ({ ...prev, weight: Math.max(20, prev.weight - 1) }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="current-weight"
                    type="number"
                    value={goals.weight}
                    onChange={(e) => setGoals(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="text-center"
                     min={20}
                     max={500}
                  />
                  <Button
                    aria-label="增加当前体重"
                    variant="outline"
                    size="icon"
                     onClick={() => setGoals(prev => ({ ...prev, weight: Math.min(500, prev.weight + 1) }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="target-weight" className="text-sm font-medium text-muted-foreground mb-2 block">目标体重 (kg)</label>
                <div className="flex items-center gap-3">
                  <Button
                    aria-label="减少目标体重"
                    variant="outline"
                    size="icon"
                     onClick={() => setGoals(prev => ({ ...prev, targetWeight: Math.max(20, prev.targetWeight - 1) }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="target-weight"
                    type="number"
                    value={goals.targetWeight}
                    onChange={(e) => setGoals(prev => ({ ...prev, targetWeight: Number(e.target.value) }))}
                    className="text-center"
                     min={20}
                     max={500}
                  />
                  <Button
                    aria-label="增加目标体重"
                    variant="outline"
                    size="icon"
                     onClick={() => setGoals(prev => ({ ...prev, targetWeight: Math.min(500, prev.targetWeight + 1) }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">体重目标</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={goals.weightGoal === "lose" ? "default" : "outline"}
                    onClick={() => setGoals(prev => ({ ...prev, weightGoal: "lose" }))}
                    className="text-sm"
                  >
                    减重
                  </Button>
                  <Button
                    variant={goals.weightGoal === "maintain" ? "default" : "outline"}
                    onClick={() => setGoals(prev => ({ ...prev, weightGoal: "maintain" }))}
                    className="text-sm"
                  >
                    保持
                  </Button>
                  <Button
                    variant={goals.weightGoal === "gain" ? "default" : "outline"}
                    onClick={() => setGoals(prev => ({ ...prev, weightGoal: "gain" }))}
                    className="text-sm"
                  >
                    增重
                  </Button>
                </div>
              </div>

              {goals.weightGoal !== "maintain" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-foreground">每周{getWeightGoalText()}目标</label>
                    <span className="text-lg font-semibold text-primary">{goals.weeklyGoal}kg</span>
                  </div>
                  <Slider
                    aria-label={`每周${getWeightGoalText()}目标`}
                    value={[goals.weeklyGoal]}
                    onValueChange={(value) => setGoals(prev => ({ ...prev, weeklyGoal: value[0] }))}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* 活动水平 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">活动水平</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={goals.activityLevel === "low" ? "default" : "outline"}
                onClick={() => setGoals(prev => ({ ...prev, activityLevel: "low" }))}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium">久坐少动</div>
                  <div className="text-xs text-muted-foreground">办公室工作，很少运动</div>
                </div>
              </Button>
              <Button
                variant={goals.activityLevel === "moderate" ? "default" : "outline"}
                onClick={() => setGoals(prev => ({ ...prev, activityLevel: "moderate" }))}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium">中等活动</div>
                  <div className="text-xs text-muted-foreground">轻度运动，每周1-3次</div>
                </div>
              </Button>
              <Button
                variant={goals.activityLevel === "high" ? "default" : "outline"}
                onClick={() => setGoals(prev => ({ ...prev, activityLevel: "high" }))}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium">高强度运动</div>
                  <div className="text-xs text-muted-foreground">每天运动或体力工作</div>
                </div>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-semibold"><Dumbbell className="mr-2 size-5 text-primary" />训练与饮食条件</h3>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium">每周训练目标</label><span className="font-semibold text-primary">{goals.trainingDaysGoal} 天</span></div>
                <Slider aria-label="每周训练目标" value={[goals.trainingDaysGoal]} onValueChange={value => setGoals(previous => ({ ...previous, trainingDaysGoal: value[0] }))} min={1} max={7} step={1} />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>1 天</span><span>7 天</span></div>
              </div>
              <div>
                <label htmlFor="training-experience" className="mb-2 block text-sm font-medium">训练经验</label>
                <select id="training-experience" value={goals.trainingExperience} onChange={event => setGoals(previous => ({ ...previous, trainingExperience: event.target.value as GoalProfile["training_experience"] }))} className="w-full rounded-md border bg-background px-3 py-2">
                  <option value="beginner">刚开始或规律训练不足一年</option><option value="intermediate">规律训练 1～3 年</option><option value="advanced">规律训练 3 年以上</option>
                </select>
              </div>
              <div><label htmlFor="available-equipment" className="mb-2 block text-sm font-medium">可用器械</label><Input id="available-equipment" value={goals.availableEquipment} onChange={event => setGoals(previous => ({ ...previous, availableEquipment: event.target.value }))} placeholder="例如：哑铃、弹力带、瑜伽垫" /><p className="mt-1 text-xs text-muted-foreground">多项请用逗号分隔</p></div>
              <div><label htmlFor="dietary-preferences" className="mb-2 block text-sm font-medium">饮食偏好或限制</label><Input id="dietary-preferences" value={goals.dietaryPreferences} onChange={event => setGoals(previous => ({ ...previous, dietaryPreferences: event.target.value }))} placeholder="例如：素食、少乳糖" /></div>
              <div><label htmlFor="allergies" className="mb-2 block text-sm font-medium">过敏食物</label><Input id="allergies" value={goals.allergies} onChange={event => setGoals(previous => ({ ...previous, allergies: event.target.value }))} placeholder="例如：花生、虾" /></div>
            </div>
          </Card>

          {/* BMI 显示 */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-foreground">当前BMI</h3>
              <div className="text-3xl font-bold text-primary mb-1">{calculateBMI()}</div>
              <p className="text-sm text-muted-foreground">
                {Number(calculateBMI()) < 18.5 ? "偏瘦" :
                 Number(calculateBMI()) < 24 ? "正常" :
                 Number(calculateBMI()) < 28 ? "偏胖" : "肥胖"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
