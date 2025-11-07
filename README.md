# SnapCal

一个面向移动端的 AI 营养记录应用。支持拍照/上传食物图片，调用大模型进行营养识别与分析，并以卡路里和三大营养素为核心进行展示与统计。

## 功能特性
- 移动端优先的 UI：底部导航 + 浮动扫描按钮（FAB）
- 扫描食物：拍照/上传图片，调用 AI 返回营养 JSON
- 营养分析页：
  - 食物名称与识别置信度
  - 份量调整（按 0.5 递增），实时联动卡路里与宏量营养
  - 环形图 + 列表展示（克数与百分比同时显示）
  - 动态详细营养素（钠/膳食纤维/维生素等）与识别食材列表
- 趋势分析页：本周/上周/本月统计与图表（Recharts）
- 全中文界面（zh-CN）

## 技术栈
- Next.js 16（App Router） + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui 组件
- Recharts（图表）、lucide-react（图标）
- @vercel/analytics（可选）

## 目录结构（节选）
- `app/`：页面与布局
  - `/` 首页
  - `/scan` 扫描入口
  - `/analysis` 扫描结果页
  - `/analytics` 趋势分析
  - `layout.tsx` 全局 `<html>` 与 `metadata`
- `components/`：通用组件（`bottom-nav.tsx`、`fab-button.tsx`、`components/ui/*`）
- `lib/`：AI 相关与工具
  - `ai-config.ts`：模型配置与提示词（FOOD_ANALYSIS_PROMPT）、结果校验
  - `doubao-service.ts`：封装豆包 API 调用与 JSON 解析
  - `utils.ts`：样式工具 `cn()`
- `public/`：静态资源与品牌图标（`logo.png` 等）

## 开发与运行
1. 安装依赖（推荐 pnpm）
   ```bash
   pnpm install
   # 或 npm install
   ```
2. 启动开发服务器
   ```bash
   pnpm dev
   # 或 npm run dev
   ```
3. 访问 http://localhost:3000

常用脚本
```bash
pnpm dev      # 开发
pnpm build    # 生产构建
pnpm start    # 生产运行
pnpm lint     # Lint（如果本地未配置 eslint，可跳过）
```

## 环境变量
- `DOUBAO_API_KEY`：豆包 API Key（在 `lib/ai-config.ts` 中通过 `process.env.DOUBAO_API_KEY` 读取；请在本地 `.env.local` 设置，不要提交到仓库）

## AI 集成说明
- 提示词位置：`lib/ai-config.ts` 中的 `FOOD_ANALYSIS_PROMPT`（已针对中式菜肴、份量估算、单位/精度等做增强）
- 服务封装：`lib/doubao-service.ts` 提供 `analyzeFoodWithDoubao(base64)` 方法，返回统一 JSON 结构
- 期望返回结构（简化）：
  ```json
  {
    "name": "食物名称",
    "confidence": 85,
    "description": "简短描述",
    "calories": 450,
    "protein": 28.5,
    "carbs": 35.0,
    "fats": 18.5,
    "ingredients": ["主要食材1", "主要食材2"],
    "nutrition": {"sodium": 850, "fiber": 3.2}
  }
  ```

### 关于 /api/analyze 路由
当前前端在 `app/scan/page.tsx` 中调用了 `POST /api/analyze`，用于转发图片到模型并返回上面的 JSON。若你需要在本地打通，可新增：

- `app/api/analyze/route.ts`（Node/Edge 任一）
- 伪代码：
  ```ts
  import { NextResponse } from 'next/server'
  import { analyzeFoodWithDoubao } from '@/lib/doubao-service'

  export async function POST(req: Request) {
    const form = await req.formData()
    const file = form.get('image') as File
    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = `data:${file.type};base64,${buf.toString('base64')}`
    const result = await analyzeFoodWithDoubao(base64)
    return NextResponse.json(result)
  }
  ```

## 品牌与资源
- 站点标题：SnapCal
- 头部与 Favicon：`public/logo.png`（在 `app/layout.tsx` 的 `metadata.icons` 中已配置）
- 浮动按钮与扫描页图标：使用 `public/jimeng-*.png`，在浅色/深色主题下通过 `invert/brightness/contrast` 保证可见性

## 已知限制
- 目前没有持久化后端；分析结果以 `sessionStorage` 传递给 `/analysis`
- `/api/analyze` 需要根据你的运行环境添加（见上文）

## 许可
未设置许可证，如需开源请根据需要补充 LICENSE。
