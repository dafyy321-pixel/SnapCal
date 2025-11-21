/**
 * 数据转换工具
 * 用于处理API返回数据和前端期望数据之间的格式转换
 */

import { FoodAnalysisData, FoodAnalysisResult } from '@/types'

/**
 * 将API返回的分析数据转换为前端期望的FoodAnalysisData格式
 * API返回的数据可能包含扁平化的字段，需要转换为嵌套的nutrition结构
 */
export function transformAnalysisData(apiData: any): FoodAnalysisData {
  // 基础字段
  const baseData: FoodAnalysisData = {
    name: apiData.name || apiData.food_name || '未知食物',
    confidence: Number(apiData.confidence) || 0,
    calories: Number(apiData.calories) || 0,
    protein: Number(apiData.protein) || 0,
    carbs: Number(apiData.carbs) || Number(apiData.carbohydrates) || 0,
    fats: Number(apiData.fats) || 0,
    ingredients: Array.isArray(apiData.ingredients) ? apiData.ingredients : [],
    image: apiData.image || apiData.raw_image_url,
  }

  // 处理营养信息 - 将扁平化的字段转换为nutrition对象
  const nutrition: any = {}

  // 检查是否存在nutrition字段
  if (apiData.nutrition) {
    Object.assign(nutrition, apiData.nutrition)
  } else {
    // 从扁平化字段收集营养信息
    const nutritionFields = [
      'fiber', 'sugar', 'sodium', 'calcium', 'iron',
      'cholesterol', 'saturated_fat', 'saturatedFat', 'trans_fat', 'transFat',
      'potassium', 'vitamin_c', 'vitaminC', 'vitamin_a', 'vitaminA',
      'vitamin_d', 'vitaminD', 'vitamin_e', 'vitaminE'
    ]

    nutritionFields.forEach(field => {
      const value = apiData[field]
      if (value !== undefined && value !== null) {
        // 标准化字段名
        const standardField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        nutrition[standardField] = Number(value)
      }
    })
  }

  // 如果有营养信息，添加到返回数据
  if (Object.keys(nutrition).length > 0) {
    baseData.nutrition = nutrition
  }

  return baseData
}

/**
 * 将前端数据转换为API期望的格式
 */
export function transformToFrontendFormat(frontendData: FoodAnalysisData): any {
  const result: any = {
    name: frontendData.name,
    confidence: frontendData.confidence,
    calories: frontendData.calories,
    protein: frontendData.protein,
    carbs: frontendData.carbs,
    fats: frontendData.fats,
    ingredients: frontendData.ingredients,
  }

  if (frontendData.image) {
    result.image = frontendData.image
  }

  // 展开nutrition字段为扁平化结构
  if (frontendData.nutrition) {
    Object.keys(frontendData.nutrition).forEach(key => {
      const value = (frontendData.nutrition as any)[key] // 使用类型断言处理动态属性访问
      if (value !== undefined && value !== null) {
        // 将驼峰命名转换为下划线命名
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        result[snakeKey] = Number(value)
      }
    })
  }

  return result
}

/**
 * 验证数据完整性并填充默认值
 */
export function validateAnalysisData(data: Partial<FoodAnalysisData>): FoodAnalysisData {
  return {
    name: data.name || '未知食物',
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