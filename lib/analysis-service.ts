/**
 * 分析结果服务
 * 管理食物分析结果的存储、查询和更新
 */

import { createClient } from '@supabase/supabase-js'
import { AppError, NotFoundError } from './error-handler'

export interface AnalysisResult {
  id?: string
  user_id: string
  meal_id?: string
  // 为避免重复分析，相同图片会使用 image_hash 进行去重
  image_hash?: string
  raw_image_url?: string
  raw_analysis_response?: any
  food_name: string
  confidence_score: number
  ingredients: string[]
  calories: number
  protein: number
  carbohydrates: number
  fats: number
  fiber?: number
  sugar?: number
  sodium?: number
  calcium?: number
  iron?: number
  cholesterol?: number
  saturated_fat?: number
  trans_fat?: number
  potassium?: number
  vitamin_c?: number
  vitamin_a?: number
  vitamin_d?: number
  vitamin_e?: number
  portion_multiplier?: number
  analysis_duration?: number
  api_version?: string
  model_version?: string
  analysis_status?: string
  file_metadata?: {
    original_name: string
    safe_name: string
    size: number
    type: string
    validation_warnings?: string[]
  }
  created_at?: string
  updated_at?: string
}

export class AnalysisService {
  // 服务端使用 service role key 访问 Supabase，避免受 RLS 限制
  // 注意：该文件仅在服务端（如 API Route）中使用，切勿在客户端代码中导入。
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  /**
   * 创建新的分析结果
   * @param analysisData 分析数据
   * @returns 创建的分析结果
   */
  async createAnalysisResult(analysisData: Omit<AnalysisResult, 'id' | 'created_at' | 'updated_at'>) {
    // 部分环境的 meal_analysis_results 表没有 file_metadata 和 image_hash 字段，
    // 这里在插入前显式剔除这些可能不存在的字段。
    const { file_metadata, image_hash, ...rest } = analysisData as any

    const insertData = {
      ...rest,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 先尝试插入所有字段
    let { data, error } = await this.supabase
      .from('meal_analysis_results')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[AnalysisService] Create error (first attempt):', error)
      console.error('[AnalysisService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        full_error: JSON.stringify(error, null, 2)
      })
      
      // 如果插入失败，说明可能某些字段在表中不存在
      // 尝试去掉更多可选字段后重新插入
      console.log('[AnalysisService] Retrying with minimal fields...')
      const minimalData = {
        user_id: rest.user_id,
        food_name: rest.food_name,
        confidence_score: rest.confidence_score,
        ingredients: rest.ingredients,
        calories: rest.calories,
        protein: rest.protein,
        carbohydrates: rest.carbohydrates,
        fats: rest.fats,
        fiber: rest.fiber,
        sugar: rest.sugar,
        sodium: rest.sodium,
        calcium: rest.calcium,
        iron: rest.iron,
        cholesterol: rest.cholesterol,
        saturated_fat: rest.saturated_fat,
        trans_fat: rest.trans_fat,
        potassium: rest.potassium,
        vitamin_c: rest.vitamin_c,
        vitamin_a: rest.vitamin_a,
        vitamin_d: rest.vitamin_d,
        vitamin_e: rest.vitamin_e,
        portion_multiplier: rest.portion_multiplier,
        analysis_duration: rest.analysis_duration,
        api_version: rest.api_version,
        model_version: rest.model_version,
        analysis_status: rest.analysis_status,
        created_at: insertData.created_at,
        updated_at: insertData.updated_at,
      }

      const { data: retryData, error: retryError } = await this.supabase
        .from('meal_analysis_results')
        .insert(minimalData)
        .select()
        .single()

      if (retryError) {
        console.error('[AnalysisService] Create error (retry):', retryError)
        console.error('[AnalysisService] Retry error details:', {
          code: retryError.code,
          message: retryError.message,
          details: retryError.details,
          hint: retryError.hint,
        })
        throw new AppError('保存分析结果失败', 500, 'ANALYSIS_CREATE_ERROR', {
          first_attempt_error: error.code,
          retry_error: retryError.code,
          message: retryError.message,
        })
      }

      console.log('[AnalysisService] Successfully saved after retry')
      return retryData
    }

    return data
  }

  /**
   * 根据ID获取分析结果
   * @param id 分析结果ID
   * @param userId 用户ID（用于权限验证）
   * @returns 分析结果
   */
  async getAnalysisResult(id: string, userId: string): Promise<AnalysisResult> {
    const { data, error } = await this.supabase
      .from('meal_analysis_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('分析结果未找到')
      }
      console.error('[AnalysisService] Get error:', error)
      throw new AppError('获取分析结果失败', 500, 'ANALYSIS_GET_ERROR')
    }

    return data
  }

  /**
   * 获取用户的分析结果列表
   * @param userId 用户ID
   * @param options 查询选项
   * @returns 分析结果列表
   */
  async getUserAnalysisResults(
    userId: string,
    options: {
      limit?: number
      offset?: number
      status?: string
      startDate?: string
      endDate?: string
    } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      status,
      startDate,
      endDate,
    } = options

    let query = this.supabase
      .from('meal_analysis_results')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 添加过滤条件
    if (status) {
      query = query.eq('analysis_status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[AnalysisService] List error:', error)
      throw new AppError('获取分析结果列表失败', 500, 'ANALYSIS_LIST_ERROR')
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    }
  }

  /**
   * 更新分析结果
   * @param id 分析结果ID
   * @param userId 用户ID（用于权限验证）
   * @param updates 更新数据
   * @returns 更新后的分析结果
   */
  async updateAnalysisResult(
    id: string,
    userId: string,
    updates: Partial<AnalysisResult>
  ) {
    const { data, error } = await this.supabase
      .from('meal_analysis_results')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('分析结果未找到')
      }
      console.error('[AnalysisService] Update error:', error)
      throw new AppError('更新分析结果失败', 500, 'ANALYSIS_UPDATE_ERROR')
    }

    return data
  }

  /**
   * 删除分析结果
   * @param id 分析结果ID
   * @param userId 用户ID（用于权限验证）
   */
  async deleteAnalysisResult(id: string, userId: string) {
    const { error } = await this.supabase
      .from('meal_analysis_results')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('分析结果未找到')
      }
      console.error('[AnalysisService] Delete error:', error)
      throw new AppError('删除分析结果失败', 500, 'ANALYSIS_DELETE_ERROR')
    }
  }

  /**
   * 关联分析结果到餐食记录
   * @param analysisId 分析结果ID
   * @param mealId 餐食记录ID
   * @param userId 用户ID（用于权限验证）
   */
  async linkToMeal(analysisId: string, mealId: string, userId: string) {
    return this.updateAnalysisResult(analysisId, userId, { meal_id: mealId })
  }

  /**
   * 调整份量并更新营养数据
   * @param id 分析结果ID
   * @param userId 用户ID（用于权限验证）
   * @param multiplier 份量倍数
   * @returns 更新后的分析结果
   */
  async adjustPortion(id: string, userId: string, multiplier: number) {
    const analysis = await this.getAnalysisResult(id, userId)

    if (multiplier < 0.5 || multiplier > 3.0) {
      throw new AppError('份量倍数必须在0.5-3.0之间', 400, 'INVALID_PORTION_MULTIPLIER')
    }

    const nutritionFields = [
      'calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'sugar',
      'sodium', 'calcium', 'iron', 'cholesterol', 'saturated_fat',
      'trans_fat', 'potassium', 'vitamin_c', 'vitamin_a', 'vitamin_d', 'vitamin_e'
    ]

    const updates: Partial<AnalysisResult> = {
      portion_multiplier: multiplier,
    }

    // 按倍数调整所有营养数值
    nutritionFields.forEach(field => {
      const value = analysis[field as keyof AnalysisResult] as number
      if (value && typeof value === 'number') {
        (updates as any)[field] = Math.round(value * multiplier * 10) / 10
      }
    })

    return this.updateAnalysisResult(id, userId, updates)
  }

  /**
   * 获取分析统计信息
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getAnalysisStats(userId: string) {
    const { data, error } = await this.supabase
      .from('meal_analysis_results')
      .select('analysis_status, confidence_score, created_at')
      .eq('user_id', userId)

    if (error) {
      console.error('[AnalysisService] Stats error:', error)
      throw new AppError('获取分析统计失败', 500, 'ANALYSIS_STATS_ERROR')
    }

    const stats = {
      totalAnalyses: data?.length || 0,
      completedAnalyses: data?.filter(item => item.analysis_status === 'completed').length || 0,
      averageConfidence: 0,
      recentAnalyses: data?.filter(item => {
        const createdAt = new Date(item.created_at!)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return createdAt > weekAgo
      }).length || 0,
    }

    if (data && data.length > 0) {
      const completedItems = data.filter(item => item.analysis_status === 'completed')
      const totalConfidence = completedItems.reduce((sum, item) => sum + (item.confidence_score || 0), 0)
      stats.averageConfidence = completedItems.length > 0
        ? Math.round(totalConfidence / completedItems.length)
        : 0
    }

    return stats
  }
}

// 导出单例实例
export const analysisService = new AnalysisService()