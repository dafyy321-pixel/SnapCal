/**
 * 应用程序类型定义
 * 统一管理所有数据结构类型，提高类型安全性
 */

// 用户相关类型
export interface User {
  id: string
  email?: string
  phone?: string
  username?: string
  user_metadata?: {
    username?: string
    phone?: string
    email?: string
    birthday?: string
    gender?: string
    height?: number
    weight?: number
  }
}

// 完整的Session类型定义，兼容Supabase Auth
export interface Session {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  expires_at: number
}

// 简化的AppSession类型用于内部状态管理
export interface AppSession {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in?: number
  token_type?: string
}

export interface UserProfile {
  user_id: string
  phone: string
  username: string
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fats_goal: number
  created_at?: string
  updated_at?: string
}

// 餐食相关类型
export interface Meal {
  id: string
  user_id: string
  meal_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_date: string
  meal_time: string
  calories: number
  protein: number
  carbs: number
  fats: number

  // 可选的营养字段
  fiber?: number
  sugar?: number
  sodium?: number
  calcium?: number
  vitamin_c?: number
  iron?: number
  cholesterol?: number
  saturated_fat?: number
  trans_fat?: number
  potassium?: number
  vitamin_a?: number
  vitamin_d?: number
  vitamin_e?: number

  // 元数据
  ingredients?: string[]
  confidence?: number
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface MealDataCache {
  [date: string]: {
    profile: UserProfile
    meals: Meal[]
    lastUpdated: number
  }
}

// AI分析相关类型
export interface FoodAnalysisResult {
  name: string
  confidence: number
  calories: number
  protein: number
  carbs: number
  fats: number
  ingredients?: string[]
  image?: string

  // 详细营养信息 - 使用统一的字段名
  fiber?: number
  sugar?: number
  sodium?: number
  calcium?: number
  iron?: number
  potassium?: number
  vitaminC?: number
  vitaminA?: number
  vitaminD?: number
  vitaminE?: number
  cholesterol?: number
  saturatedFat?: number
  transFat?: number

  // 份量信息
  portion?: {
    size: string
    weight: number
    multiplier: number
  }

  // API返回的额外字段
  portion_multiplier?: number
  created_at?: string
  updated_at?: string
}

// 专门为analysis页面设计的接口，兼容API返回格式
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

export interface AnalysisRequest {
  imageData: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

export interface AnalysisResponse {
  success: boolean
  data?: FoodAnalysisResult
  error?: {
    message: string
    code: string
  }
  timestamp: string
}

// 分析记录类型
export interface MealAnalysisResult {
  id: string
  user_id: string
  meal_id?: string
  image_hash: string
  raw_analysis_response: string
  processed_data: FoodAnalysisResult
  confidence_score: number
  analysis_status: 'pending' | 'completed' | 'failed'
  api_version?: string
  model_version?: string
  created_at: string
  updated_at?: string
}

// 登录记录类型
export interface LoginRecord {
  id: string
  user_id?: string
  phone: string
  email?: string
  username?: string
  ip_address: string
  user_agent: string
  login_time: string
  created_at?: string
}

// 分析统计类型
export interface NutritionSummary {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  mealCount: number
}

export interface DailyNutritionData {
  date: string
  meals: Meal[]
  summary: NutritionSummary
  goals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  remaining: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  progress: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
}

export interface AnalyticsData {
  currentPeriod: {
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFats: number
    mealCount: number
    averageCaloriesPerMeal: number
    dailyAverages: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
  }
  previousPeriod: {
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFats: number
    mealCount: number
  }
  trends: {
    calories: 'increase' | 'decrease' | 'stable'
    protein: 'increase' | 'decrease' | 'stable'
    carbs: 'increase' | 'decrease' | 'stable'
    fats: 'increase' | 'decrease' | 'stable'
  }
  timeframe: '本周' | '上周' | '本月'
  dailyGoals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}> {}

// 图表数据类型
export interface ChartDataPoint {
  name: string
  value: number
  date?: string
  type?: string
}

export interface NutritionChartData {
  dates: string[]
  calories: number[]
  protein: number[]
  carbs: number[]
  fats: number[]
}

// 中间件类型
export interface AuthenticatedRequest extends Request {
  user: User
}

// 表单类型
export interface LoginForm {
  phone: string
  password: string
}

export interface RegisterForm {
  phone: string
  password: string
  username: string
}

export interface MealFormData {
  meal_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fats: number
  meal_date?: string
  meal_time?: string
}

// 错误类型
export interface AppErrorDetails {
  field?: string
  message: string
  value?: any
}

// 配置类型
export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  doubaoApiKey: string
  environment: 'development' | 'production'
}