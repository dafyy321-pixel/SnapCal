// 豆包 API 配置
export const DOUBAO_CONFIG = {
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: process.env.DOUBAO_API_KEY || '1ecd94b9-3975-43d8-843c-c35116df09a0',
  model: 'doubao-seed-1-6-flash-250828',
}

// AI 食物分析提示词
export const FOOD_ANALYSIS_PROMPT = `你是一位专业的营养学家和食物识别专家。请根据提供的食物图片进行详细的营养分析。

## 分析步骤
第一步：仔细观察图片，识别食物的种类、食材构成和大致份量
第二步：判断烹饪方式（如煎、炒、蒸、煮、烤、炸等）
第三步：基于食材和烹饪方式，计算营养成分
第四步：根据食物特点，补充相关的营养信息

## 必须输出的营养素
- 卡路里（calories）: 必须
- 蛋白质（protein）: 必须
- 碳水化合物（carbs）: 必须  
- 脂肪（fats）: 必须

## 可选的营养素（根据食物类型选择性输出）
- 膳食纤维（fiber）: 适用于蔬菜、水果、全谷物等
- 糖（sugar）: 适用于甜品、水果、含糖饮料等
- 钠（sodium）: 适用于加工食品、腌制食品、快餐等
- 钙（calcium）: 适用于乳制品、豆制品等
- 维生素C（vitaminC）: 适用于水果、新鲜蔬菜等
- 铁（iron）: 适用于肉类、豆类等
- 胆固醇（cholesterol）: 适用于动物性食品
- 任何其他你认为对该食物重要的营养素

## 输出格式
严格按照以下 JSON 格式输出，不要包含任何其他文字：

{
  "name": "食物名称（中文）",
  "confidence": 置信度数字（0-100整数）,
  "description": "食物的简短描述",
  "calories": 卡路里数值,
  "protein": 蛋白质克数,
  "carbs": 碳水化合物克数,
  "fats": 脂肪克数,
  "ingredients": ["主要食材1", "主要食材2", "..."],
  "nutrition": {
    // 这里根据食物类型添加其他营养素
    // 例如：
    // "fiber": 膳食纤维克数,
    // "sugar": 糖克数,
    // "sodium": 钠毫克数,
    // "calcium": 钙毫克数
    // 等等
  }
}

## 示例

高纤维蔬菜沙拉：
{
  "name": "田园蔬菜沙拉",
  "confidence": 92,
  "description": "新鲜生菜、番茄、黄瓜配橄榄油醋汁",
  "calories": 120,
  "protein": 3.5,
  "carbs": 12.0,
  "fats": 7.5,
  "ingredients": ["生菜", "番茄", "黄瓜", "橄榄油", "醋"],
  "nutrition": {
    "fiber": 4.2,
    "sugar": 3.5,
    "sodium": 85,
    "vitaminC": 28
  }
}

油炸食品：
{
  "name": "炸鸡腿",
  "confidence": 95,
  "description": "裹粉油炸的鸡腿，外酥里嫩",
  "calories": 450,
  "protein": 28.0,
  "carbs": 18.0,
  "fats": 28.0,
  "ingredients": ["鸡腿", "面粉", "鸡蛋", "面包糠", "油"],
  "nutrition": {
    "sodium": 820,
    "cholesterol": 165,
    "saturatedFat": 7.2
  }
}

只输出 JSON 对象，不要添加任何markdown标记或其他说明文字。`

// 验证和处理 AI 返回结果
export function validateAndProcessFoodData(data: any) {
  // 确保必需字段存在
  const required = ['name', 'confidence', 'calories', 'protein', 'carbs', 'fats']
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`缺少必需字段: ${field}`)
    }
  }

  // 如果没有 nutrition 字段，从旧格式迁移
  if (!data.nutrition) {
    data.nutrition = {}
    const optionalFields = ['fiber', 'sugar', 'sodium', 'calcium', 'vitaminC', 'iron', 'cholesterol']
    optionalFields.forEach(field => {
      if (data[field] !== undefined) {
        data.nutrition[field] = data[field]
        delete data[field]
      }
    })
  }

  return data
}
