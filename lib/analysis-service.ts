import { NotFoundError } from "./error-handler"
import { localDb, type AnalysisInput, type AnalysisRecord } from "./local-db"

export type AnalysisResult = AnalysisRecord

const nutritionFields = [
  "calories", "protein", "carbohydrates", "fats", "fiber", "sugar", "sodium", "calcium", "iron",
  "cholesterol", "saturated_fat", "trans_fat", "potassium", "vitamin_c", "vitamin_a", "vitamin_d", "vitamin_e",
] as const

export class AnalysisService {
  async createAnalysisResult(data: AnalysisInput): Promise<AnalysisRecord> {
    return localDb.createAnalysis(data)
  }

  async replaceAnalysisResult(id: string, data: AnalysisInput): Promise<AnalysisRecord> {
    return localDb.replaceAnalysis(id, data)
  }

  async getAnalysisResult(id: string): Promise<AnalysisRecord> {
    const result = localDb.getAnalysis(id)
    if (!result) throw new NotFoundError("分析结果不存在")
    return result
  }

  async findByHash(hash: string): Promise<AnalysisRecord | null> {
    return localDb.findAnalysisByHash(hash)
  }

  async updateAnalysisResult(id: string, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord> {
    const result = localDb.updateAnalysis(id, updates)
    if (!result) throw new NotFoundError("分析结果不存在")
    return result
  }

  async deleteAnalysisResult(id: string): Promise<void> {
    const changes = localDb.deleteAnalysis(id)
    if (!changes) throw new NotFoundError("分析结果不存在")
  }

  async linkToMeal(analysisId: string, mealId: string): Promise<AnalysisRecord> {
    if (!localDb.getMeal(mealId)) throw new NotFoundError("餐食记录不存在")
    return this.updateAnalysisResult(analysisId, { meal_id: mealId })
  }

  async adjustPortion(id: string, multiplier: number): Promise<AnalysisRecord> {
    const current = await this.getAnalysisResult(id)
    const updates: Partial<AnalysisRecord> = { portion_multiplier: multiplier }
    for (const field of nutritionFields) {
      const baseField = `base_${field}` as keyof AnalysisRecord
      updates[field] = Math.round(Number(current[baseField]) * multiplier * 100) / 100
    }
    return this.updateAnalysisResult(id, updates)
  }
}

export const analysisService = new AnalysisService()

export function formatAnalysis(result: AnalysisRecord) {
  return {
    id: result.id,
    name: result.food_name,
    image: result.raw_image_url,
    confidence: result.confidence_score,
    calories: result.calories,
    protein: result.protein,
    carbs: result.carbohydrates,
    fats: result.fats,
    fiber: result.fiber,
    sugar: result.sugar,
    sodium: result.sodium,
    calcium: result.calcium,
    iron: result.iron,
    cholesterol: result.cholesterol,
    saturated_fat: result.saturated_fat,
    trans_fat: result.trans_fat,
    potassium: result.potassium,
    vitamin_c: result.vitamin_c,
    vitamin_a: result.vitamin_a,
    vitamin_d: result.vitamin_d,
    vitamin_e: result.vitamin_e,
    ingredients: result.ingredients,
    portion_multiplier: result.portion_multiplier,
    created_at: result.created_at,
    updated_at: result.updated_at,
  }
}
