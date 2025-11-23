/**
 * 环境变量配置和验证
 * 确保所有必需的环境变量都已正确设置
 */

interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  doubaoApiKey: string
  isDevelopment: boolean
  isProduction: boolean
  useMockAnalysis: boolean
}

/**
 * 验证环境变量配置
 * @returns 验证后的环境变量配置
 * @throws 如果缺少必需的环境变量
 */
export function validateEnv(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const doubaoApiKey = process.env.DOUBAO_API_KEY
  const nodeEnv = process.env.NODE_ENV || 'development'
  const useMockAnalysis = process.env.USE_MOCK_ANALYSIS === 'true'

  // 验证必需的环境变量
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': supabaseUrl,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': supabaseAnonKey,
    'DOUBAO_API_KEY': doubaoApiKey,
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value || value.trim() === '')
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `❌ 缺少必需的环境变量: ${missingVars.join(', ')}\n\n` +
      `请检查 .env.local 文件，确保所有必需变量都已设置。\n` +
      `可以参考 .env.template 文件进行配置。`
    )
  }

  // 验证 URL 格式
  try {
    new URL(supabaseUrl!)
  } catch {
    throw new Error(
      `❌ NEXT_PUBLIC_SUPABASE_URL 格式无效: ${supabaseUrl}\n` +
      `请确保 URL 格式正确，例如: https://your-project.supabase.co`
    )
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    doubaoApiKey: doubaoApiKey!,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    useMockAnalysis,
  }
}

/**
 * 获取环境变量配置
 * @returns 环境变量配置
 */
export function getEnvConfig(): EnvConfig {
  // 在开发环境中每次都验证，生产环境中缓存结果
  if (process.env.NODE_ENV === 'development') {
    return validateEnv()
  }

  // 生产环境使用缓存（仅在首次调用时验证）
  if (!global._envConfig) {
    global._envConfig = validateEnv()
  }
  return global._envConfig
}

// TypeScript 全局声明
declare global {
  var _envConfig: EnvConfig | undefined
}

/**
 * 环境变量配置常量
 */
export const ENV_CONFIG = getEnvConfig()