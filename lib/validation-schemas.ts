import { z } from "zod"

/**
 * 通用验证schema
 */

// UUID格式验证
const uuidSchema = z.string().uuid('无效的ID格式')

// 日期格式与真实日期验证
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '无效的日期格式')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  }, '无效的日期')

// 仅时间（HH:mm 或 HH:mm:ss），适合与单独的日期字段配合使用
export const timeSchema = z.string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, '无效的时间格式')
  .refine((value) => {
    const [hours, minutes, seconds = '0'] = value.split(':')
    return Number(hours) <= 23 && Number(minutes) <= 59 && Number(seconds) <= 59
  }, '无效的时间')

// 分页参数验证
const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

// 正整数验证
const positiveIntSchema = z.coerce.number().int().positive('必须是正整数')

const nonNegativeIntSchema = z.coerce.number().int().nonnegative('必须是非负整数')

// 非负数验证
const nonNegativeNumberSchema = z.coerce.number().nonnegative('必须是非负数')

// 用户资料更新schema
export const userProfileSchema = z.object({
  username: z.string().trim().min(1, '姓名不能为空').max(50, '姓名不能超过50位').optional(),
  avatar_url: z.union([z.string().url(), z.string().regex(/^\/api\/images\/[a-zA-Z0-9._-]+$/)]).nullable().optional(),
  birthday: dateSchema.nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  height: z.coerce.number().min(50).max(300).nullable().optional(),
  weight: z.coerce.number().min(20).max(500).nullable().optional(),
  target_weight: z.coerce.number().min(20).max(500).nullable().optional(),
  weekly_goal: z.coerce.number().min(0).max(5).optional(),
  activity_level: z.enum(['low', 'moderate', 'high']).optional(),
  weight_goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  daily_calorie_goal: positiveIntSchema.max(10000, '每日卡路里目标不能超过10000').optional(),
  daily_protein_goal: positiveIntSchema.max(1000).optional(),
  daily_carbs_goal: positiveIntSchema.max(1000).optional(),
  daily_fats_goal: positiveIntSchema.max(1000).optional(),
}).strict()

/**
 * 餐食相关验证schema
 */

// 餐食记录创建schema
export const createMealSchema = z.object({
  meal_name: z.string().min(1, '餐食名称不能为空').max(100, '餐食名称不能超过100位'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: '无效的餐食类型' })
  }),
  meal_date: dateSchema,
  // 只要求为有效的时间字符串（如 14:30 或 14:30:00），数据库会与 meal_date 一起使用
  meal_time: timeSchema.optional(),
  calories: nonNegativeIntSchema.max(10000, '卡路里不能超过10000'),
  protein: nonNegativeNumberSchema.max(1000, '蛋白质不能超过1000克'),
  carbs: nonNegativeNumberSchema.max(1000, '碳水化合物不能超过1000克'),
  fats: nonNegativeNumberSchema.max(1000, '脂肪不能超过1000克'),
  ingredients: z.array(z.string().max(50, '食材名称不能超过50位')).max(20, '食材不能超过20种').optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  image_url: z.union([z.string().url(), z.string().regex(/^\/api\/images\/[a-zA-Z0-9._-]+$/)]).nullable().optional(),
  fiber: nonNegativeNumberSchema.max(1000).optional(),
  sugar: nonNegativeNumberSchema.max(1000).optional(),
  sodium: nonNegativeNumberSchema.max(100000).optional(),
  calcium: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_c: nonNegativeNumberSchema.max(100000).optional(),
  iron: nonNegativeNumberSchema.max(100000).optional(),
  cholesterol: nonNegativeNumberSchema.max(100000).optional(),
  saturated_fat: nonNegativeNumberSchema.max(1000).optional(),
  trans_fat: nonNegativeNumberSchema.max(1000).optional(),
  potassium: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_a: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_d: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_e: nonNegativeNumberSchema.max(100000).optional(),
}).strict()

// 餐食记录更新schema
export const updateMealSchema = z.object({
  meal_name: z.string().min(1, '餐食名称不能为空').max(100, '餐食名称不能超过100位').optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: '无效的餐食类型' })
  }).optional(),
  calories: nonNegativeIntSchema.max(10000, '卡路里不能超过10000').optional(),
  protein: nonNegativeNumberSchema.max(1000, '蛋白质不能超过1000克').optional(),
  carbs: nonNegativeNumberSchema.max(1000, '碳水化合物不能超过1000克').optional(),
  fats: nonNegativeNumberSchema.max(1000, '脂肪不能超过1000克').optional(),
  ingredients: z.array(z.string().max(50, '食材名称不能超过50位')).max(20, '食材不能超过20种').optional(),
  meal_date: dateSchema.optional(),
  meal_time: timeSchema.optional(),
  image_url: z.union([z.string().url(), z.string().regex(/^\/api\/images\/[a-zA-Z0-9._-]+$/)]).nullable().optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  fiber: nonNegativeNumberSchema.max(1000).optional(),
  sugar: nonNegativeNumberSchema.max(1000).optional(),
  sodium: nonNegativeNumberSchema.max(100000).optional(),
  calcium: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_c: nonNegativeNumberSchema.max(100000).optional(),
  iron: nonNegativeNumberSchema.max(100000).optional(),
  cholesterol: nonNegativeNumberSchema.max(100000).optional(),
  saturated_fat: nonNegativeNumberSchema.max(1000).optional(),
  trans_fat: nonNegativeNumberSchema.max(1000).optional(),
  potassium: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_a: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_d: nonNegativeNumberSchema.max(100000).optional(),
  vitamin_e: nonNegativeNumberSchema.max(100000).optional(),
}).strict()

/**
 * 分析相关验证schema
 */

// 分析请求查询参数schema
export const analyticsQuerySchema = z.object({
  timeframe: z.enum(['本周', '上周', '本月'], {
    errorMap: () => ({ message: '无效的时间范围' })
  }).default('本周'),
})

// 分析结果ID验证schema
export const analysisIdSchema = z.object({
  id: uuidSchema,
})

// 份量调整schema
export const portionAdjustmentSchema = z.object({
  portion_multiplier: z.coerce.number()
    .min(0.5, '份量倍数不能小于0.5')
    .max(3.0, '份量倍数不能大于3.0')
    .step(0.1, '份量倍数必须是0.1的倍数'),
})

// 分析结果链接到餐食schema
export const linkAnalysisToMealSchema = z.object({
  meal_id: uuidSchema,
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: '无效的餐食类型' })
  }),
  custom_notes: z.string().max(500, '自定义备注不能超过500字').optional(),
})

/**
 * 文件上传相关验证schema
 */

// 图片上传验证选项
export const imageUploadValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFiles: 1,
  requiredFields: ['image'],
}

/**
 * API参数验证schema
 */

// 路由参数验证schema（用于动态路由）
export const routeParamsSchema = z.object({
  id: uuidSchema,
})

/**
 * 分页和排序验证schema
 */

// 通用列表查询schema
export const listQuerySchema = paginationSchema.extend({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100, '搜索关键词不能超过100字符').optional(),
})

/**
 * 健康数据验证schema
 */

// 体重记录schema
export const weightRecordSchema = z.object({
  weight: z.coerce.number().positive('体重必须是正数').max(500, '体重不能超过500kg'),
  date: dateSchema,
  notes: z.string().max(200, '备注不能超过200字').optional(),
})

// 身体数据schema
export const bodyMetricsSchema = z.object({
  height: z.coerce.number().positive('身高必须是正数').max(300, '身高不能超过300cm'),
  target_weight: z.coerce.number().positive('目标体重必须是正数').max(500, '目标体重不能超过500kg').optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
    errorMap: () => ({ message: '无效的活动水平' })
  }).optional(),
})

/**
 * 营养目标验证schema
 */

// 营养目标schema
export const nutritionGoalsSchema = z.object({
  daily_calorie_goal: positiveIntSchema.max(10000, '每日卡路里目标不能超过10000'),
  daily_protein_goal: positiveIntSchema.max(1000, '每日蛋白质目标不能超过1000克').optional(),
  daily_carbs_goal: positiveIntSchema.max(1000, '每日碳水化合物目标不能超过1000克').optional(),
  daily_fats_goal: positiveIntSchema.max(1000, '每日脂肪目标不能超过1000克').optional(),
})

/**
 * 导出和导入验证schema
 */

// 数据导出schema
export const dataExportSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  date_range: z.object({
    start: dateSchema,
    end: dateSchema,
  }).optional(),
  include_types: z.array(z.enum(['meals', 'analytics', 'profile'])).optional(),
})

/**
 * 工具函数
 */

// 验证并转换日期格式
export const validateAndFormatDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error('无效的日期格式')
  }
  return date.toISOString().split('T')[0]
}

// 验证并限制数值范围
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): number => {
  const num = Number(value)
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`${fieldName}必须在${min}-${max}之间`)
  }
  return num
}
