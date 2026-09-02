export interface NutritionData {
  sodium?: number
  fiber?: number
  sugar?: number
  calcium?: number
  iron?: number
  cholesterol?: number
  saturatedFat?: number
  transFat?: number
  potassium?: number
  vitaminC?: number
  vitaminA?: number
  vitaminD?: number
  vitaminE?: number
}

export interface FoodAnalysisData {
  name: string
  image?: string
  confidence: number
  description?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  ingredients: string[]
  nutrition?: NutritionData
}
