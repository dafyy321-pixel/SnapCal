export type MealDraft = {
  meal_name: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  meal_date: string
  meal_time: string
  image_url: string
  ingredients: string[]
  confidence: number
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  requires_nutrition_confirmation: boolean
}


export function mealDraftInput(draft: MealDraft) {
  if ([draft.calories, draft.protein, draft.carbs, draft.fats].some(value => value == null)) throw new Error("请先确认卡路里和三项宏量营养数据")
  return {
    meal_name: draft.meal_name, meal_type: draft.meal_type, meal_date: draft.meal_date,
    meal_time: draft.meal_time, image_url: draft.image_url, ingredients: draft.ingredients,
    confidence: draft.confidence, calories: draft.calories!, protein: draft.protein!,
    carbs: draft.carbs!, fats: draft.fats!,
  }
}
