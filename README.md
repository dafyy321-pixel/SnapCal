# 🍎 SnapCal - AI驱动的智能营养记录应用

<div align="center">

![SnapCal Logo](./public/logo.png)

**SnapCal** 是一款基于 **AI 技术**的**智能营养记录应用**，通过拍照识别食物，自动分析营养成分，帮助用户轻松追踪每日**卡路里**和**营养摄入**。

> 🎯 **关键词**：AI 营养记录 | 卡路里追踪 | 食物识别 | 健康管理 | 营养分析 | 饮食记录 | Next.js | React | TypeScript | 移动端应用 | 中式饮食

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#️-技术栈) • [项目结构](#-项目结构) • [部署指南](#-部署指南) • [API文档](#-api文档)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3.5-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📖 项目简介

**SnapCal** 是一个面向移动端的 **AI 驱动的智能营养记录应用**，支持通过拍照或上传食物图片，利用大语言模型（豆包 AI）自动识别食物并分析营养成分。应用以**卡路里追踪**和**三大营养素**（蛋白质、碳水化合物、脂肪）为核心，提供直观的可视化统计和趋势分析，帮助用户科学管理日常饮食。

### 适用场景

- 🏃 **健身人群**：追踪每日蛋白质、碳水化合物和脂肪摄入
- 💪 **减肥人群**：监控卡路里摄入，控制热量缺口
- 🥗 **健康管理**：了解食物营养成分，做出更健康的饮食选择
- 📱 **移动用户**：随时随地记录饮食，无需手动输入
- 🍜 **中式饮食**：特别优化中式菜肴的营养分析

### 核心亮点

- 🤖 **AI 智能识别**：基于豆包大模型，精准识别食物类型和营养成分，支持中式菜肴识别
- 📱 **移动端优先**：专为移动设备设计的响应式 UI，支持触摸操作和手势交互
- 📊 **可视化统计**：直观的图表展示（Recharts），支持周/月营养趋势分析
- 🎯 **精准计算**：支持份量调整（0.5x-3.0x），实时计算卡路里和宏量营养素
- 🍜 **中式优化**：特别针对中式菜肴的营养分析优化（考虑油、盐含量）
- 🌙 **深色模式**：支持浅色/深色主题切换，保护眼睛
- ⚡ **实时更新**：数据实时同步，响应迅速
- 🎨 **现代 UI**：基于 shadcn/ui 和 Tailwind CSS 的现代化界面设计

---

## ✨ 功能特性

### 🎯 核心功能

- **📸 食物扫描**
  - 支持相机拍照和图片上传
  - 实时预览和裁剪
  - 自动识别食物类型和份量

- **📊 营养分析**
  - 自动识别食物名称和置信度
  - 卡路里计算（精确到整数）
  - 三大营养素分析（蛋白质、碳水化合物、脂肪）
  - 详细营养素展示（钠、膳食纤维、维生素等）
  - 份量调整功能（0.5倍递增），实时联动计算
  - 环形图 + 列表双重展示（克数与百分比）

- **📈 趋势分析**
  - 本周/上周/本月统计对比
  - 卡路里和营养素趋势图表
  - 日均摄入量分析
  - 目标达成情况可视化

- **📱 移动端体验**
  - 底部导航栏快速切换
  - 浮动扫描按钮（FAB）
  - 响应式布局，适配各种屏幕尺寸
  - 流畅的动画和交互效果

- **🌍 中文界面**
  - 全中文界面（zh-CN）
  - 本地化日期和时间格式
  - 符合中文用户使用习惯

---

## 🛠️ 技术栈

### 前端框架
- **Next.js 16** - React 全栈框架（App Router）
- **React 19.2** - UI 库
- **TypeScript 5.6** - 类型安全

### UI 与样式
- **Tailwind CSS v4.1** - 实用优先的 CSS 框架
- **shadcn/ui** - 高质量组件库 (Radix UI)
- **lucide-react** - 图标库
- **next-themes** - 主题切换支持
- **React Hook Form** - 表单处理
- **Zod** - 数据验证

### 后端与数据库
- **Supabase** - 数据库、认证和存储
- **PostgreSQL** - 主数据库
- **SWR** - 数据获取和缓存

### 数据可视化
- **Recharts** - React 图表库
- **date-fns** - 日期处理

### AI 集成
- **豆包 API (Doubao)** - 字节跳动大语言模型 (doubao-seed-1-6-flash-250828)
- 自定义提示词工程 (135行优化提示词)
- JSON 结果校验与处理
- 图片哈希去重和缓存机制

### 开发工具
- **ESLint** - 代码检查
- **PostCSS** - CSS 处理
- **Autoprefixer** - CSS 兼容性
- **环境变量验证** - lib/env-config.ts

### 安全与性能
- **安全头部配置** - CSP, XSS 防护等
- **文件验证中间件** - 图片安全检查
- **认证中间件** - JWT 令牌管理
- **TypeScript 严格模式** - 构建时类型检查

### 部署与分析
- **Vercel** - 部署平台
- **Vercel Analytics** - 用户行为分析

---

## 📁 项目结构

```
SnapCal/
├── app/                          # Next.js App Router 页面
│   ├── layout.tsx               # 根布局（全局 HTML 和 metadata）
│   ├── page.tsx                 # 首页（每日营养概览）
│   ├── globals.css              # 全局样式
│   ├── scan/                    # 扫描页面
│   │   └── page.tsx             # 相机/上传界面
│   ├── analysis/                # 分析结果页
│   │   └── page.tsx             # 营养详情展示
│   ├── analytics/               # 趋势分析页
│   │   └── page.tsx             # 统计图表
│   ├── profile/                 # 个人中心
│   │   ├── page.tsx             # 用户主页
│   │   ├── edit/                # 编辑资料
│   │   ├── goals/               # 目标设置
│   │   ├── achievements/        # 成就系统
│   │   ├── export/              # 导出数据
│   │   ├── privacy/             # 隐私设置
│   │   ├── notifications/       # 通知设置
│   │   ├── share/               # 分享功能
│   │   ├── about/               # 关于页面
│   │   └── help/                # 帮助页面
│   ├── meal/[id]/               # 餐食详情页
│   │   └── page.tsx             # 动态餐食详情
│   ├── auth/                    # 认证页面
│   │   └── page.tsx             # 登录/注册
│   ├── admin/                   # 管理后台
│   │   └── login-records/       # 登录记录管理
│   └── api/                     # API 路由
│       ├── analyze/             # 食物分析接口
│       │   └── route.ts         # POST /api/analyze
│       ├── meals/               # 餐食记录 CRUD
│       │   ├── route.ts         # GET/POST /api/meals
│       │   └── [id]/route.ts    # GET/PUT/DELETE /api/meals/[id]
│       ├── analytics/           # 营养分析统计
│       │   └── route.ts         # GET /api/analytics
│       ├── analysis/[id]/       # 分析记录详情
│       │   └── route.ts         # GET /api/analysis/[id]
│       └── auth/                # 认证相关接口
│           ├── login/           # 登录
│           ├── register/        # 注册
│           └── login-records/   # 登录记录
├── components/                  # 组件库
│   ├── ui/                      # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   └── ...                  # 其他 UI 组件
│   ├── bottom-nav.tsx           # 底部导航栏
│   ├── fab-button.tsx           # 浮动扫描按钮
│   ├── theme-provider.tsx       # 主题提供者
│   ├── auth-guard.tsx           # 认证守卫
│   ├── error-boundary.tsx       # 错误边界
│   └── optimized-image.tsx      # 优化图片组件
├── lib/                         # 工具库
│   ├── ai-config.ts             # AI 配置和提示词
│   ├── doubao-service.ts        # 豆包 API 封装
│   ├── supabase.ts              # Supabase 客户端和服务
│   ├── auth-manager.ts          # 认证管理器
│   ├── analysis-service.ts      # 分析服务
│   ├── env-config.ts            # 环境变量验证
│   ├── auth-middleware.ts       # 认证中间件
│   ├── validation-middleware.ts # 验证中间件
│   ├── error-handler.ts         # 错误处理
│   ├── api-response.ts          # API 响应格式化
│   ├── auth-error-handler.ts    # 认证错误处理
│   ├── file-security.ts         # 文件安全验证
│   ├── data-transform.ts        # 数据转换
│   └── utils.ts                 # 工具函数（cn 等）
├── hooks/                       # 自定义 Hooks
│   ├── use-mobile.ts            # 移动端检测
│   ├── use-toast.ts             # Toast 通知
│   ├── use-auth.ts              # 认证状态
│   ├── use-loading-state.ts     # 加载状态
│   └── use-persistent-state.ts  # 持久化状态
├── types/                       # TypeScript 类型定义
│   └── index.ts                 # 全局类型定义
├── middleware.ts                # Next.js 中间件
├── public/                      # 静态资源
│   ├── logo.png                 # 应用图标
│   └── ...                      # 其他资源
├── migrations/                  # 数据库迁移
│   ├── add_nutrition_details.sql # 营养详情字段
│   └── create_logging_tables.sql # 日志表
├── supabase/migrations/         # Supabase 迁移
│   └── add_performance_indexes.sql # 性能索引
├── .env.template                # 环境变量模板
├── .env.local                   # 本地环境变量（不提交）
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.js           # Tailwind 配置
├── next.config.mjs              # Next.js 配置
└── README.md                    # 项目说明
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **pnpm** >= 8.0.0

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/your-username/SnapCal.git
cd SnapCal
```

2. **安装依赖**

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

3. **配置环境变量**

复制环境变量模板并创建 `.env.local` 文件：

```bash
cp .env.template .env.local
```

编辑 `.env.local` 文件，填入必需的配置：

```bash
# ===========================================
# Supabase 配置 (必需)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ===========================================
# AI 服务配置 (必需)
# ===========================================
DOUBAO_API_KEY=your-doubao-api-key-here

# ===========================================
# 开发配置 (可选)
# ===========================================
USE_MOCK_ANALYSIS=false  # 开发调试用
NODE_ENV=development
```

> 💡 **获取配置值**：
> - **Supabase**: 访问 [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
> - **豆包 API**: 访问 [火山引擎控制台](https://console.volcengine.com/)，开通豆包服务后创建 API Key

4. **数据库设置**

```bash
# 安装 Supabase CLI（如果尚未安装）
npm install -g supabase

# 推送数据库迁移
supabase db push

# 或直接执行 SQL 文件
psql -h <your-host> -U postgres -d postgres -f migrations/add_nutrition_details.sql
```

5. **验证环境变量**

```bash
# 检查环境变量是否正确配置
npm run env:check
```

6. **启动开发服务器**

```bash
npm run dev
# 或
pnpm dev
```

7. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 常用命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建并检查类型
npm run build:check

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 检查环境变量
npm run env:check
```

---

## 🧩 核心功能详解

### 1. 食物识别流程

```
用户拍照/上传图片
    ↓
图片转 Base64
    ↓
调用 /api/analyze 接口
    ↓
豆包 AI 分析（基于 FOOD_ANALYSIS_PROMPT）
    ↓
解析 JSON 结果
    ↓
数据校验和处理
    ↓
返回营养信息
```

### 2. AI 提示词工程

项目使用了精心设计的提示词（`lib/ai-config.ts`），针对以下场景优化：

- ✅ 中式菜肴识别（考虑油、盐含量）
- ✅ 份量估算（一碗、一盘、一份等）
- ✅ 烹饪方式判断（清蒸、水煮、炒、煎、炸等）
- ✅ 营养数据准确性（基于标准营养数据库）
- ✅ 置信度评估（0-100分）

### 3. 数据结构

AI 返回的标准 JSON 格式：

```json
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
```

### 4. 份量调整算法

- 支持 0.5、1.0、1.5、2.0 等倍率调整
- 实时计算：`调整后值 = 原始值 × 倍率`
- 同时更新卡路里和所有营养素

---

## 🔧 开发指南

### 添加新功能

1. **添加新页面**

```bash
# 在 app/ 目录下创建新页面
mkdir app/new-page
touch app/new-page/page.tsx
```

2. **添加新组件**

```bash
# 在 components/ 目录下创建组件
touch components/new-component.tsx
```

3. **添加新的 API 路由**

```bash
# 在 app/api/ 目录下创建路由
mkdir app/api/new-endpoint
touch app/api/new-endpoint/route.ts
```

### 自定义 AI 提示词

编辑 `lib/ai-config.ts` 中的 `FOOD_ANALYSIS_PROMPT`：

```typescript
export const FOOD_ANALYSIS_PROMPT = `
你的自定义提示词...
`
```

### 修改主题颜色

编辑 `app/globals.css` 中的 CSS 变量：

```css
:root {
  --protein: #your-color;
  --carbs: #your-color;
  --fats: #your-color;
}
```

---

## 📦 部署指南

### Vercel 部署（推荐）

1. **连接 GitHub 仓库**

   - 访问 [Vercel](https://vercel.com/)
   - 点击 "New Project"
   - 导入 SnapCal 仓库

2. **配置环境变量**

   在 Vercel 项目设置中添加：

   ```
   DOUBAO_API_KEY=your_doubao_api_key
   ```

3. **部署**

   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy" 完成部署

### 其他平台部署

#### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t snapcal .
docker run -p 3000:3000 -e DOUBAO_API_KEY=your_key snapcal
```

#### 传统服务器部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

---

## 🧪 测试

### 使用模拟数据测试

在 `.env.local` 中设置：

```bash
USE_MOCK_ANALYSIS=true
```

这将使用内置的模拟数据，无需调用真实的 AI API。

### 测试食物识别

1. 启动开发服务器
2. 访问 `/scan` 页面
3. 上传测试图片或使用相机拍照
4. 查看分析结果

---

## 📝 API 文档

### 认证

所有 API 路由都需要 JWT 认证（除了 `/api/auth/login` 和 `/api/auth/register`）。在请求头中包含：

```
Authorization: Bearer <your-jwt-token>
```

### POST /api/auth/login

用户登录。

**请求**

```typescript
// Content-Type: application/json
{
  email: string
  password: string
}
```

**响应**

```typescript
{
  success: boolean
  data: {
    user: {
      id: string
      email: string
      // 其他用户信息
    }
    session: {
      access_token: string
      refresh_token: string
    }
  }
}
```

### POST /api/auth/register

用户注册。

**请求**

```typescript
// Content-Type: application/json
{
  email: string
  password: string
  // 其他注册信息
}
```

### POST /api/analyze

分析食物图片，返回营养信息。

**请求**

```typescript
// Content-Type: multipart/form-data
FormData {
  image: File  // 图片文件（最大 5MB）
  use_mock?: boolean  // 可选：使用模拟数据
  force_reanalyze?: boolean  // 可选：强制重新分析
}
```

**响应**

```typescript
{
  success: boolean
  data: {
    analysisId: string
    data: {
      name: string          // 食物名称
      confidence: number    // 置信度 (0-100)
      calories: number      // 卡路里
      protein: number       // 蛋白质 (g)
      carbs: number         // 碳水化合物 (g)
      fats: number          // 脂肪 (g)
      ingredients: string[] // 食材列表
      nutrition?: {         // 详细营养素（可选）
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
      }
      image: string         // Base64 图片
      timestamp: string     // 时间戳
      analysis_duration?: number  // 分析耗时 (ms)
    }
    file_warnings?: string[]  // 文件警告信息
  }
}
```

### GET /api/meals

获取用户的餐食记录。

**查询参数**

- `date`: string (可选) - 指定日期，格式 YYYY-MM-DD

**响应**

```typescript
{
  success: boolean
  data: {
    profile: {
      daily_calorie_goal: number
      daily_protein_goal: number
      daily_carbs_goal: number
      daily_fats_goal: number
    }
    meals: Array<{
      id: string
      meal_name: string
      meal_type: string
      meal_date: string
      meal_time: string
      calories: number
      protein: number
      carbs: number
      fats: number
      // ... 详细营养素
    }>
  }
}
```

### POST /api/meals

创建新的餐食记录。

**请求**

```typescript
// Content-Type: application/json
{
  meal_name: string
  meal_type: string      // breakfast/lunch/dinner/snack
  meal_date: string      // YYYY-MM-DD
  meal_time: string      // HH:mm:ss
  calories: number
  protein: number
  carbs: number
  fats: number
  image_url?: string
  // 详细营养信息（可选）
  fiber?: number
  sugar?: number
  sodium?: number
  ingredients?: string[]
  confidence?: number
}
```

### GET /api/analytics

获取营养分析统计数据。

**查询参数**

- `timeframe`: string (可选) - "本周" | "上周" | "本月"，默认 "本周"

**响应**

```typescript
{
  success: boolean
  data: {
    timeframe: string
    total_days: number
    nutrition_summary: {
      total_calories: number
      avg_calories: number
      total_protein: number
      avg_protein: number
      // ... 其他营养素统计
    }
    daily_data: Array<{
      date: string
      calories: number
      protein: number
      carbs: number
      fats: number
    }>
    trends: {
      calorie_change: number      // 相比上期变化百分比
      protein_change: number
      // ... 其他趋势数据
    }
  }
}
```

### GET /api/analysis/[id]

获取分析结果详情。

**路径参数**

- `id`: string - 分析记录 ID

**响应**

```typescript
{
  success: boolean
  data: {
    id: string
    user_id: string
    food_name: string
    confidence_score: number
    // ... 完整的分析结果数据
    created_at: string
    analysis_status: string
  }
}
```

## 🔒 错误处理

所有 API 返回统一的错误格式：

```typescript
{
  success: false
  error: {
    code: string          // 错误代码
    message: string       // 错误信息
    details?: any         // 详细错误信息
  }
}
```

### 常见错误代码

- `VALIDATION_ERROR` - 请求参数验证失败
- `AUTHENTICATION_ERROR` - 认证失败
- `AUTHORIZATION_ERROR` - 权限不足
- `FILE_TOO_LARGE` - 文件过大
- `UNSUPPORTED_FILE_TYPE` - 不支持的文件类型
- `AI_ANALYSIS_ERROR` - AI 分析失败
- `RATE_LIMIT_EXCEEDED` - 请求频率超限

---

## 🗄️ 数据库架构

### 主要数据表

#### user_profiles 表
用户配置文件和目标设置

```sql
- id (uuid) - 主键
- user_id (uuid) - 关联 auth.users
- daily_calorie_goal (numeric) - 每日卡路里目标
- daily_protein_goal (numeric) - 每日蛋白质目标 (g)
- daily_carbs_goal (numeric) - 每日碳水目标 (g)
- daily_fats_goal (numeric) - 每日脂肪目标 (g)
- created_at (timestamptz) - 创建时间
- updated_at (timestamptz) - 更新时间
```

#### user_meals 表
用户餐食记录

```sql
- id (uuid) - 主键
- user_id (uuid) - 关联用户
- meal_name (text) - 食物名称
- meal_type (text) - 餐次类型
- meal_date (date) - 餐食日期
- meal_time (timestamptz) - 用餐时间
- calories (numeric) - 卡路里
- protein/carbs/fats (numeric) - 三大营养素
- fiber/sugar/sodium (numeric) - 膳食纤维、糖、钠
- calcium/vitamin_c/iron (numeric) - 钙、维C、铁
- cholesterol/saturated_fat (numeric) - 胆固醇、饱和脂肪
- ingredients (text[]) - 食材列表
- confidence (integer) - AI 置信度
- image_url (text) - 图片链接
- created_at (timestamptz) - 创建时间
```

#### meal_analysis_results 表
AI 分析结果缓存

```sql
- id (uuid) - 主键
- user_id (uuid) - 关联用户
- image_hash (text) - 图片哈希（去重用）
- raw_image_url (text) - 原始图片
- food_name (text) - 识别的食物名称
- confidence_score (integer) - 置信度分数
- calories/protein/carbohydrates/fats (numeric) - 营养信息
- analysis_duration (integer) - 分析耗时 (ms)
- model_version (text) - AI 模型版本
- analysis_status (text) - 分析状态
- created_at (timestamptz) - 创建时间
```

#### auth_login_records 表
登录记录日志

```sql
- id (uuid) - 主键
- user_id (uuid) - 用户ID
- email (text) - 登录邮箱
- ip_address (text) - IP地址
- user_agent (text) - 用户代理
- success (boolean) - 是否成功
- failure_reason (text) - 失败原因
- created_at (timestamptz) - 登录时间
```

### 数据库索引

为优化查询性能，已添加以下索引：

```sql
-- user_meals 表索引
CREATE INDEX idx_user_meals_user_date ON user_meals(user_id, meal_date DESC);
CREATE INDEX idx_user_meals_date ON user_meals(meal_date DESC);

-- meal_analysis_results 表索引
CREATE INDEX idx_analysis_results_user_hash ON meal_analysis_results(user_id, image_hash);
CREATE INDEX idx_analysis_results_created ON meal_analysis_results(created_at DESC);

-- auth_login_records 表索引
CREATE INDEX idx_login_records_user ON auth_login_records(user_id, created_at DESC);
CREATE INDEX idx_login_records_email ON auth_login_records(email, created_at DESC);
```

---

## 🐛 常见问题

### Q: 无法识别食物怎么办？

A:
1. 确保图片清晰，光线充足
2. 食物占图片主体位置
3. 尝试重新拍摄或上传
4. 检查豆包 API Key 是否有效
5. 使用 `USE_MOCK_ANALYSIS=true` 测试功能

### Q: 营养数据不准确？

A:
1. AI 识别基于图片估算，可能存在误差
2. 可通过份量调整功能手动校准（0.5x-3.0x）
3. 建议结合实际情况调整
4. 查看置信度分数，低置信度结果需谨慎参考

### Q: 环境变量配置错误？

A:
1. 运行 `npm run env:check` 检查配置
2. 确保所有必需变量都已设置
3. 检查 Supabase URL 和 Key 的格式
4. 验证豆包 API Key 权限

### Q: 数据库连接失败？

A:
1. 检查 Supabase 项目是否运行正常
2. 验证数据库迁移是否完成：`supabase db push`
3. 确认 RLS (Row Level Security) 策略配置
4. 检查网络连接和防火墙设置

### Q: 构建失败怎么办？

A:
1. 运行 `npm run type-check` 检查类型错误
2. 确保所有依赖已正确安装：`npm install`
3. 检查环境变量是否完整：`npm run env:check`
4. 使用 `npm run build:check` 进行完整检查

### Q: 部署后无法访问？

A:
1. 检查 Vercel 环境变量配置
2. 查看 Vercel 函数日志排查错误
3. 确认 API Key 权限和配额
4. 检查 Supabase 域名是否已添加到 images.domains

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建特性分支**

```bash
git checkout -b feature/AmazingFeature
```

3. **提交更改**

```bash
git commit -m 'Add some AmazingFeature'
```

4. **推送到分支**

```bash
git push origin feature/AmazingFeature
```

5. **开启 Pull Request**

### 贡献方向

- 🐛 修复 Bug
- ✨ 添加新功能
- 📝 改进文档
- 🎨 UI/UX 优化
- ⚡ 性能优化
- 🌐 多语言支持

---

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 优秀组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [豆包 AI](https://www.volcengine.com/product/doubao) - AI 能力支持
- [Recharts](https://recharts.org/) - 图表库
- [Lucide](https://lucide.dev/) - 图标库

---

## 🗺️ 页面路由说明

### 首页 (`/`)

- **功能**：每日营养概览和饮食记录
- **特性**：
  - 剩余卡路里显示（带动画效果）
  - 三大营养素进度环（蛋白质、碳水化合物、脂肪）
  - 按餐次分组的食物记录（早餐、午餐、晚餐）
  - 周日期选择器
  - 成就系统入口

### 扫描页面 (`/scan`)

- **功能**：食物拍照和上传
- **特性**：
  - 相机实时预览
  - 图片上传支持
  - 拍照/上传切换
  - 图片裁剪和预览
  - AI 分析进度提示

### 分析页面 (`/analysis`)

- **功能**：展示食物营养分析结果
- **特性**：
  - 食物名称和置信度显示
  - 份量调整滑块（0.5x - 3.0x）
  - 卡路里和三大营养素环形图
  - 详细营养素列表（可展开/收起）
  - 食材列表展示
  - 保存到饮食记录

### 趋势分析 (`/analytics`)

- **功能**：营养摄入趋势统计
- **特性**：
  - 时间范围选择（本周/上周/本月）
  - 卡路里趋势图表（柱状图）
  - 营养素趋势图表（折线图）
  - 平均摄入量统计
  - 趋势对比（上升/下降百分比）
  - 营养素分布饼图

### 个人中心 (`/profile`)

- **功能**：用户设置和个人信息
- **特性**：
  - 用户信息展示
  - 连续打卡天数
  - 成就系统
  - 设置菜单（通知、隐私、应用设置）
  - 分享功能

---

## 📸 使用示例

### 示例 1：扫描食物

```typescript
// 1. 打开扫描页面
navigate('/scan')

// 2. 选择拍照或上传
const image = await capturePhoto() // 或选择文件

// 3. 上传到 API
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: formData
})

// 4. 获取分析结果
const { data } = await response.json()
// {
//   name: "番茄炒蛋",
//   calories: 180,
//   protein: 12.5,
//   ...
// }
```

### 示例 2：调整份量

```typescript
// 在分析页面调整份量
const multiplier = 1.5 // 1.5倍

const adjustedCalories = originalCalories * multiplier
const adjustedProtein = originalProtein * multiplier
const adjustedCarbs = originalCarbs * multiplier
const adjustedFats = originalFats * multiplier
```

### 示例 3：查看趋势

```typescript
// 获取本周数据
const weeklyData = {
  days: ['周一', '周二', ...],
  calories: [1800, 2100, ...],
  protein: [85, 95, ...],
  // ...
}
```

---

## 🎨 主题定制

项目支持完整的主题定制，包括浅色和深色模式。

### 颜色配置

编辑 `app/globals.css` 修改主题颜色：

```css
:root {
  /* 营养素颜色 */
  --protein: oklch(0.62 0.12 180);  /* 蛋白质 - 青绿色 */
  --carbs: oklch(0.7 0.18 50);      /* 碳水化合物 - 橙色 */
  --fats: oklch(0.6 0.2 240);       /* 脂肪 - 蓝色 */
  --success: oklch(0.65 0.18 140);  /* 成功 - 绿色 */
  
  /* 主题颜色 */
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0.01 240);
  /* ... */
}
```

### 启用深色模式

项目已集成 `next-themes`，可以在任何组件中使用：

```typescript
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      切换主题
    </button>
  )
}
```

---

## ⚡ 性能优化

### 已实现的优化

1. **图片优化**
   - Base64 编码压缩
   - 自动裁剪和缩放
   - 延迟加载（Lazy Loading）

2. **代码分割**
   - Next.js 自动代码分割
   - 动态导入（Dynamic Imports）
   - 路由级别的代码分割

3. **缓存策略**
   - API 响应缓存
   - 静态资源缓存
   - 浏览器缓存优化

4. **渲染优化**
   - React 19 并发特性
   - 虚拟滚动（如需要）
   - 防抖和节流

### 建议的优化

- [ ] 添加 Service Worker 支持 PWA
- [ ] 实现图片 CDN 加速
- [ ] 添加数据库持久化
- [ ] 实现离线支持
- [ ] 添加数据预加载

---

## 🔒 安全考虑

### API 密钥管理

- ✅ 使用环境变量存储敏感信息
- ✅ `.env.local` 已添加到 `.gitignore`
- ✅ 不要在客户端代码中暴露 API Key

### 数据隐私

- ⚠️ 当前使用 `sessionStorage` 存储数据（临时）
- 💡 建议：实现后端数据库存储
- 💡 建议：添加用户认证和授权
- 💡 建议：实现数据加密

### 图片处理

- ✅ 客户端 Base64 编码
- ✅ 服务器端验证
- ⚠️ 建议：添加图片大小限制
- ⚠️ 建议：添加文件类型验证

---

## 🔒 安全特性

### 已实现的安全措施

1. **认证与授权**
   - ✅ JWT 令牌认证机制
   - ✅ 自动令牌刷新
   - ✅ 会话管理和超时处理
   - ✅ Row Level Security (RLS) 策略

2. **API 安全**
   - ✅ 请求速率限制 (100次/15分钟)
   - ✅ 文件大小限制 (5MB)
   - ✅ 文件类型验证
   - ✅ 文件内容安全检查
   - ✅ 统一错误处理

3. **安全头部配置**
   - ✅ Content Security Policy (CSP)
   - ✅ X-Content-Type-Options: nosniff
   - ✅ X-Frame-Options: DENY
   - ✅ X-XSS-Protection
   - ✅ Strict-Transport-Security

4. **数据保护**
   - ✅ 环境变量加密存储
   - ✅ 敏感信息不暴露给客户端
   - ✅ API 密钥安全配置
   - ✅ 数据库连接加密

5. **TypeScript 严格模式**
   - ✅ 构建时类型检查 (`ignoreBuildErrors: false`)
   - ✅ 运行时数据验证 (Zod schemas)
   - ✅ API 参数验证

6. **图片处理安全**
   - ✅ 文件元数据清理
   - ✅ 恶意内容检测
   - ✅ 安全文件名生成
   - ✅ Base64 编码验证

### 安全最佳实践

- 🔒 定期轮换 API 密钥
- 🔒 监控异常登录活动
- 🔒 使用强密码策略
- 🔒 定期备份重要数据
- 🔒 遵循最小权限原则

---

## 🚧 已知问题与限制

### 当前限制

1. **数据持久化**
   - ✅ **已解决**：集成 Supabase 数据库
   - 所有数据现在都持久化存储

2. **用户系统**
   - ✅ **已解决**：完整的用户认证系统
   - 支持注册、登录、会话管理

3. **AI 准确性**
   - ⚠️ AI 识别基于图片估算，可能存在误差
   - ✅ 已添加置信度分数和份量调整功能
   - 💡 建议：用户可以手动调整数据

4. **离线支持**
   - ❌ 仍需要网络连接才能使用 AI 分析
   - 💡 计划：添加 PWA 支持和离线模式

---

## 🗺️ 路线图

### v1.1.0 (计划中)

- [ ] 用户认证系统
- [ ] 数据库持久化
- [ ] 多设备数据同步
- [ ] 导出数据功能（CSV/PDF）

### v1.2.0 (计划中)

- [ ] PWA 支持
- [ ] 离线模式
- [ ] 推送通知
- [ ] 社交分享功能

### v1.3.0 (计划中)

- [ ] 食物数据库扩展
- [ ] 自定义食物添加
- [ ] 饮食计划推荐
- [ ] 营养师咨询功能

### 未来计划

- [ ] 多语言支持（英文、日文等）
- [ ] 健康数据集成（Apple Health、Google Fit）
- [ ] AI 营养建议
- [ ] 社区功能（分享食谱、打卡等）

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建特性分支**

```bash
git checkout -b feature/AmazingFeature
```

3. **提交更改**

```bash
git commit -m 'Add some AmazingFeature'
```

4. **推送到分支**

```bash
git push origin feature/AmazingFeature
```

5. **开启 Pull Request**

### 贡献方向

- 🐛 **修复 Bug**：发现并修复代码中的问题
- ✨ **添加新功能**：实现新特性或改进现有功能
- 📝 **改进文档**：完善 README、代码注释等
- 🎨 **UI/UX 优化**：改进界面设计和用户体验
- ⚡ **性能优化**：提升应用性能
- 🌐 **多语言支持**：添加新的语言支持
- 🧪 **测试**：添加单元测试和集成测试

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 保持代码格式一致（Prettier）
- 添加必要的注释
- 编写清晰的提交信息

---

## 📚 相关资源

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [豆包 API 文档](https://www.volcengine.com/product/doubao)

### 学习资源

- [Next.js 学习路径](https://nextjs.org/learn)
- [React 教程](https://react.dev/learn)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

### 工具推荐

- [Vercel](https://vercel.com/) - 部署平台
- [GitHub](https://github.com/) - 代码托管
- [Figma](https://www.figma.com/) - 设计工具

---

## 📊 项目统计

![GitHub stars](https://img.shields.io/github/stars/your-username/SnapCal?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/SnapCal?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/SnapCal)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/SnapCal)

---

## 📮 联系方式

- **项目主页**: [https://github.com/your-username/SnapCal](https://github.com/your-username/SnapCal)
- **问题反馈**: [Issues](https://github.com/your-username/SnapCal/issues)
- **功能建议**: [Discussions](https://github.com/your-username/SnapCal/discussions)
- **Pull Request**: [Pull Requests](https://github.com/your-username/SnapCal/pulls)

---

## ⭐ Star 历史

如果这个项目对你有帮助，欢迎 Star ⭐ 支持！

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/SnapCal&type=Date)](https://star-history.com/#your-username/SnapCal&Date)

---

## 📝 更新日志

### v1.0.0 (2024-01-XX)

- ✨ 初始版本发布
- ✨ AI 食物识别功能
- ✨ 营养分析展示
- ✨ 趋势统计图表
- ✨ 移动端优化 UI

---

## 🙏 致谢

感谢以下项目和社区的支持：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 优秀组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [豆包 AI](https://www.volcengine.com/product/doubao) - AI 能力支持
- [Recharts](https://recharts.org/) - 图表库
- [Lucide](https://lucide.dev/) - 图标库
- 所有贡献者和用户

---

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

---

<div align="center">

**用 ❤️ 和 ☕ 制作**

Made with ❤️ and ☕

<p>
  <a href="https://github.com/your-username/SnapCal">GitHub</a> •
  <a href="https://github.com/your-username/SnapCal/issues">问题反馈</a> •
  <a href="https://github.com/your-username/SnapCal/discussions">讨论</a>
</p>

</div>
