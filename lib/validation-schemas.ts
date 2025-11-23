import { z } from "zod"

/**
 * 通用验证schema
 */

// UUID格式验证
const uuidSchema = z.string().uuid('无效的ID格式')

// 手机号验证
const phoneSchema = z.string()
  .regex(/^1[3-9]\d{9}$/, '无效的手机号格式')

// 邮箱验证
const emailSchema = z.string().email('无效的邮箱格式')

// 日期格式验证
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '无效的日期格式')

// 时间戳验证（ISO 日期时间，用于需要完整时间戳的场景）
const timestampSchema = z.string().datetime('无效的时间格式')

// 仅时间（HH:mm 或 HH:mm:ss），适合与单独的日期字段配合使用
const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, '无效的时间格式')

// 分页参数验证
const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

// 正整数验证
const positiveIntSchema = z.coerce.number().int().positive('必须是正整数')

// 非负数验证
const nonNegativeNumberSchema = z.coerce.number().nonnegative('必须是非负数')

/**
 * 用户相关验证schema
 */

// 用户登录schema
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, '密码至少6位').max(100, '密码不能超过100位'),
})

// 用户注册schema
export const registerSchema = z.object({
  phone: phoneSchema,
  password: z.string()
    .min(8, '密码至少8位')
    .max(100, '密码不能超过100位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  confirm_password: z.string(),
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称不能超过50位').optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "两次输入的密码不一致",
  path: ["confirm_password"],
})

// 用户资料更新schema
export const userProfileSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称不能超过50位').optional(),
  avatar_url: z.string().url('无效的头像URL').optional(),
  daily_calorie_goal: positiveIntSchema.max(10000, '每日卡路里目标不能超过10000').optional(),
})

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
  calories: positiveIntSchema.max(10000, '卡路里不能超过10000'),
  protein: nonNegativeNumberSchema.max(1000, '蛋白质不能超过1000克'),
  carbs: nonNegativeNumberSchema.max(1000, '碳水化合物不能超过1000克'),
  fats: nonNegativeNumberSchema.max(1000, '脂肪不能超过1000克'),
  ingredients: z.array(z.string().max(50, '食材名称不能超过50位')).max(20, '食材不能超过20种').optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  image_url: z.string().url('无效的图片URL').optional(),
})

// 餐食记录更新schema
export const updateMealSchema = z.object({
  meal_name: z.string().min(1, '餐食名称不能为空').max(100, '餐食名称不能超过100位').optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    errorMap: () => ({ message: '无效的餐食类型' })
  }).optional(),
  calories: positiveIntSchema.max(10000, '卡路里不能超过10000').optional(),
  protein: nonNegativeNumberSchema.max(1000, '蛋白质不能超过1000克').optional(),
  carbs: nonNegativeNumberSchema.max(1000, '碳水化合物不能超过1000克').optional(),
  fats: nonNegativeNumberSchema.max(1000, '脂肪不能超过1000克').optional(),
  ingredients: z.array(z.string().max(50, '食材名称不能超过50位')).max(20, '食材不能超过20种').optional(),
})

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
 * 登录记录相关验证schema
 */

// 登录记录查询schema
export const loginRecordsQuerySchema = z.object({
  phone: phoneSchema.optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
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

// 食物分析请求schema
export const foodAnalysisSchema = z.object({
  image: z.instanceof(File, { message: '请提供有效的图片文件' }),
  use_mock: z.coerce.boolean().optional(),
})

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
 * 设置和配置验证schema
 */

// 用户设置schema
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().length(2, '语言代码必须是2位').default('zh'),
  notifications: z.object({
    meal_reminders: z.boolean().default(true),
    weekly_report: z.boolean().default(true),
    achievement_alerts: z.boolean().default(true),
  }).optional(),
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