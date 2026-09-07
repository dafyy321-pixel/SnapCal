import { z } from "zod"

const LEGACY_MODEL = "doubao-seed-1-6-flash-250828"
const LEGACY_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

function timeout(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(120_000, Math.max(1_000, parsed)) : 30_000
}

export function getAiConfig(env: Readonly<Record<string, string | undefined>> = process.env) {
  const genericKey = env.OPENAI_API_KEY?.trim()
  const legacyKey = env.DOUBAO_API_KEY?.trim()
  const usingLegacy = !genericKey && Boolean(legacyKey)
  const apiKey = genericKey || legacyKey || ""
  const baseUrl = (usingLegacy ? LEGACY_BASE_URL : env.OPENAI_API_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "")
  const baseModel = usingLegacy ? LEGACY_MODEL : env.OPENAI_MODEL?.trim() || ""
  const visionModel = env.OPENAI_VISION_MODEL?.trim() || baseModel
  const textModel = env.OPENAI_TEXT_MODEL?.trim() || baseModel
  return {
    configured: Boolean(apiKey && (visionModel || textModel)),
    provider: usingLegacy ? "doubao" as const : "openai-compatible" as const,
    apiKey,
    baseUrl,
    endpoint: `${baseUrl}/chat/completions`,
    visionModel,
    textModel,
    timeoutMs: timeout(env.AI_REQUEST_TIMEOUT_MS),
  }
}

// AI 食物分析提示词
export const FOOD_ANALYSIS_PROMPT = `你是一位专业的营养学家和食物识别专家。请根据提供的食物图片进行详细的营养分析。

## 核心要求
1. **准确识别**：仔细观察食物类型、食材、烹饪方式和份量
2. **标准份量**：所有营养数据基于图片中显示的实际份量（一份/一盘/一碗）
3. **中式菜肴重点**：中式菜肴通常含较多油和盐，需特别注意脂肪和钠的含量
4. **保守估算**：如果不确定，宁可低估置信度，但营养数据要尽可能准确

## 分析步骤
1. **识别食物**：确定主要食物名称和类型
2. **估算份量**：判断图片中食物的大致重量/体积（如：一碗约300g、一盘约400g、一份约150g）
3. **识别烹饪方式**：判断烹饪方法（清蒸、水煮、炒、煎、炸、烤等），这直接影响油脂含量
4. **计算营养素**：
   - 基于食材的营养成分数据库
   - 根据烹饪方式调整（如：炒菜通常额外添加10-15g油；油炸食品吸油率20-30%）
   - 考虑调味料（盐、糖、酱油等）
5. **补充特定营养素**：根据食物特点添加重要的微量营养素

## 必需字段（务必提供）
- **name**: 食物名称（中文，简洁准确）
- **confidence**: 识别置信度（0-100整数）
  - 90-100: 非常确定能识别出食物和食材
  - 70-89: 大致能识别，但部分细节不确定
  - 50-69: 只能模糊识别食物类型
  - <50: 无法准确识别
- **description**: 简短描述（20字内，说明主要食材和做法）
- **calories**: 卡路里（整数，单位：千卡 kcal）
- **protein**: 蛋白质（保留1位小数，单位：克 g）
- **carbs**: 碳水化合物（保留1位小数，单位：克 g）
- **fats**: 脂肪（保留1位小数，单位：克 g）
- **ingredients**: 主要食材数组（3-8个食材，按重要程度排序）

## 可选字段（nutrition 对象内）
根据食物类型选择性添加，单位务必正确：
- **fiber**: 膳食纤维（g） - 蔬菜、水果、全谷物
- **sugar**: 糖（g） - 甜品、水果、含糖饮料
- **sodium**: 钠（mg，注意是毫克！） - 加工食品、中式炒菜、快餐
- **calcium**: 钙（mg） - 乳制品、豆制品、绿叶菜
- **vitaminC**: 维生素C（mg） - 水果、新鲜蔬菜
- **iron**: 铁（mg） - 红肉、动物内脏、豆类
- **cholesterol**: 胆固醇（mg） - 动物性食品、蛋黄
- **saturatedFat**: 饱和脂肪（g） - 油炸食品、肥肉、奶油
- **transFat**: 反式脂肪（g） - 加工食品、人造黄油
- **potassium**: 钾（mg） - 香蕉、土豆、肉类

## 输出格式
严格输出纯 JSON，不要包含注释、markdown 标记或任何额外文字：

{
  "mode": "meal",
  "name": "食物名称",
  "confidence": 85,
  "description": "简短描述",
  "calories": 450,
  "protein": 28.5,
  "carbs": 35.0,
  "fats": 18.5,
  "ingredients": ["主要食材1", "主要食材2", "食材3"],
  "items": [{ "name": "主要食材1", "confidence": 85, "portionHint": null, "nutritionKnown": false }],
  "uncertainties": ["照片无法确认精确份量"],
  "nutrition": {
    "sodium": 850,
    "fiber": 3.2
  }
}

## 参考示例

示例1 - 中式家常菜：
{
  "name": "番茄炒蛋",
  "confidence": 95,
  "description": "番茄和鸡蛋快炒，加少量油盐",
  "calories": 180,
  "protein": 12.5,
  "carbs": 8.5,
  "fats": 11.0,
  "ingredients": ["番茄", "鸡蛋", "食用油", "盐", "葱"],
  "nutrition": {
    "sodium": 450,
    "cholesterol": 320,
    "vitaminC": 18,
    "fiber": 2.1
  }
}

示例2 - 油炸食品：
{
  "name": "炸鸡腿",
  "confidence": 92,
  "description": "裹粉油炸的鸡腿肉",
  "calories": 480,
  "protein": 28.0,
  "carbs": 22.0,
  "fats": 30.0,
  "ingredients": ["鸡腿", "面粉", "鸡蛋", "面包糠", "植物油"],
  "nutrition": {
    "sodium": 920,
    "cholesterol": 165,
    "saturatedFat": 8.5,
    "transFat": 0.5
  }
}

示例3 - 健康轻食：
{
  "name": "田园蔬菜沙拉",
  "confidence": 90,
  "description": "生菜、番茄、黄瓜配橄榄油",
  "calories": 125,
  "protein": 3.5,
  "carbs": 12.0,
  "fats": 7.5,
  "ingredients": ["生菜", "番茄", "黄瓜", "橄榄油", "醋"],
  "nutrition": {
    "fiber": 4.5,
    "sugar": 3.8,
    "sodium": 85,
    "vitaminC": 32,
    "potassium": 380
  }
}

## 特殊情况处理
- **多个菜品**：只分析最主要或最大份的单个菜品
- **无法识别**：仍需输出基本结构，confidence 设为 30-40，营养数据给出保守估算
- **半成品/原材料**：按生食状态估算，description 中说明
- **饮料/汤类**：注意液体体积，通常一杯约250ml，一碗约350ml

**只输出 JSON 对象，不要包含任何其他内容。**`

const nutritionValue = z.number().finite().nonnegative().max(100000)
export const foodAnalysisResultSchema = z.object({
  mode: z.literal("meal").default("meal"),
  name: z.string().trim().min(1).max(100),
  confidence: z.number().finite().min(0).max(100),
  description: z.string().trim().max(200).optional(),
  calories: z.number().finite().nonnegative().max(10000),
  protein: z.number().finite().nonnegative().max(1000),
  carbs: z.number().finite().nonnegative().max(1000),
  fats: z.number().finite().nonnegative().max(1000),
  ingredients: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  items: z.array(z.object({
    id: z.string().min(1).max(100).optional(),
    name: z.string().trim().min(1).max(100),
    confidence: z.number().finite().min(0).max(100),
    portionHint: z.string().trim().max(100).nullable().default(null),
    nutritionKnown: z.boolean().default(false),
  }).strict()).max(20).default([]),
  uncertainties: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  nutrition: z.object({
    fiber: nutritionValue.optional(),
    sugar: nutritionValue.optional(),
    sodium: nutritionValue.optional(),
    calcium: nutritionValue.optional(),
    vitaminC: nutritionValue.optional(),
    vitaminA: nutritionValue.optional(),
    vitaminD: nutritionValue.optional(),
    vitaminE: nutritionValue.optional(),
    iron: nutritionValue.optional(),
    cholesterol: nutritionValue.optional(),
    saturatedFat: nutritionValue.optional(),
    transFat: nutritionValue.optional(),
    potassium: nutritionValue.optional(),
  }).default({}),
}).transform(value => ({
  ...value,
  items: (value.items.length ? value.items : value.ingredients.map(name => ({
    name,
    confidence: value.confidence,
    portionHint: null,
    nutritionKnown: false,
  }))).map((item, index) => ({ ...item, id: ("id" in item && item.id) || `meal-item-${index + 1}` })),
}))

export type ValidatedFoodAnalysis = z.infer<typeof foodAnalysisResultSchema>

export function validateAndProcessFoodData(data: unknown): ValidatedFoodAnalysis {
  return foodAnalysisResultSchema.parse(data)
}
