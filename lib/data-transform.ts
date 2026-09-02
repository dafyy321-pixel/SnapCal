import { FoodAnalysisData, NutritionData } from "@/types"

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {}
}

function number(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function transformAnalysisData(value: unknown): FoodAnalysisData {
  const data = object(value)
  const aliases: Array<[keyof NutritionData, string[]]> = [
    ["fiber", ["fiber"]], ["sugar", ["sugar"]], ["sodium", ["sodium"]], ["calcium", ["calcium"]],
    ["iron", ["iron"]], ["cholesterol", ["cholesterol"]], ["saturatedFat", ["saturated_fat", "saturatedFat"]],
    ["transFat", ["trans_fat", "transFat"]], ["potassium", ["potassium"]], ["vitaminC", ["vitamin_c", "vitaminC"]],
    ["vitaminA", ["vitamin_a", "vitaminA"]], ["vitaminD", ["vitamin_d", "vitaminD"]], ["vitaminE", ["vitamin_e", "vitaminE"]],
  ]
  const sourceNutrition = object(data.nutrition)
  const nutrition: NutritionData = {}
  for (const [target, sources] of aliases) {
    const source = sources.find(key => sourceNutrition[key] !== undefined || data[key] !== undefined)
    if (source) nutrition[target] = number(sourceNutrition[source] ?? data[source])
  }

  return {
    name: String(data.name || data.food_name || "未知食物"),
    confidence: number(data.confidence ?? data.confidence_score),
    calories: number(data.calories),
    protein: number(data.protein),
    carbs: number(data.carbs ?? data.carbohydrates),
    fats: number(data.fats),
    ingredients: Array.isArray(data.ingredients) ? data.ingredients.filter(item => typeof item === "string") : [],
    image: typeof (data.image ?? data.raw_image_url) === "string" ? String(data.image ?? data.raw_image_url) : undefined,
    description: typeof data.description === "string" ? data.description : undefined,
    nutrition,
  }
}

export function validateAnalysisData(data: Partial<FoodAnalysisData>): FoodAnalysisData {
  return {
    name: data.name || "未知食物",
    confidence: data.confidence || 0,
    calories: data.calories || 0,
    protein: data.protein || 0,
    carbs: data.carbs || 0,
    fats: data.fats || 0,
    ingredients: data.ingredients || [],
    nutrition: data.nutrition || {},
    image: data.image,
    description: data.description,
  }
}
