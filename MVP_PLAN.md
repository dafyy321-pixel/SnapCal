# SnapCal MVP 上线实施计划

## 1. 问题陈述（Problem Statement）

SnapCal 目标是：通过 AI 识别食物并记录营养信息，为中文用户提供「拍照即可记录卡路里和三大营养素」的移动优先应用。当前代码已经实现了完整的核心功能链路（登录、扫描、营养分析、保存到数据库、趋势分析），但要作为对外的 MVP 上线，还需要在安全性、数据持久化、权限边界和用户体验上做一轮收尾和减法，确保：

- 不会泄露敏感数据或滥用后端能力（Supabase Service Role、登录记录等）。
- 关键业务路径稳定可用：登录 → 扫描 → 分析 → 保存 → 查看统计。
- 对未登录用户和出错场景有可预期的体验，而不是静默失败或 500 报错。

---

## 2. 当前状态概览（Current State）

### 2.1 技术与架构

- **前端框架**：Next.js 16（App Router），React 19 + TypeScript，移动端优先 UI。
  - 入口与布局：`app/layout.tsx`、`app/page.tsx`。
- **AI 能力**：豆包 API + 自定义提示词。
  - 配置与提示词：`lib/ai-config.ts`。
  - 调用与 JSON 解析：`lib/doubao-service.ts`。
  - 图片上传与分析接口：`app/api/analyze/route.ts`。
- **数据与认证**：Supabase 作为 Auth 和主数据库。
  - 通用客户端与会话封装：`lib/supabase.ts`（`authService`、`mealsService`、`analyticsService`）。
  - 餐食记录接口：`app/api/meals/route.ts`、`app/api/meals/[id]/route.ts`。
  - 统计接口：`app/api/analytics/route.ts`。
  - 登录 / 注册接口：`app/api/auth/login/route.ts`、`app/api/auth/register/route.ts`。
  - 登录记录查询接口（使用 Service Role）：`app/api/auth/login-records/route.ts`。
- **数据库迁移**：
  - `migrations/add_nutrition_details.sql` 为 `user_meals` 增加了扩展营养字段与 `ingredients`、`confidence`。
- **构建状态**：
  - `npm run build` ✅ 通过，所有页面和 API 路由可以正常打包。
  - `next.config.mjs` 中配置了 `typescript.ignoreBuildErrors: true`（类型检查被跳过，有潜在风险）。

### 2.2 关键业务流

1. **认证与用户配置**
   - 前端页面：`app/auth/page.tsx` 提供手机号 + 密码登录/注册；注册时写入 `user_login_records` 和 `user_profiles`。
   - 登录逻辑：`/api/auth/login` 通过手机号查 `user_login_records` 中保存的 email，再用 Supabase Auth 登录，并记录登录日志。
   - 注册逻辑：`/api/auth/register` 用 Service Role 创建用户、写入 `user_login_records` 和 `user_profiles`。

2. **食物扫描 → AI 分析 → 保存餐食**
   - 扫描页面：`app/scan/page.tsx`
     - 通过 `<input type="file" capture="environment">` 打开相机或相册。
     - 客户端限制文件大小 `< 10MB`，将图片读为 base64 预览。
     - 点击「AI 分析」后，构造 `FormData` 调用 `POST /api/analyze`。
   - 分析接口：`app/api/analyze/route.ts`
     - 从 `FormData` 中读取 `image` 文件，转为 base64。
     - 根据 `USE_MOCK_ANALYSIS` 选择：
       - 模拟分析：`simulateFoodAnalysis` 从 `foodDatabase` 随机返回一条食物营养数据（仅开发/测试使用）。
       - 真正分析：调用 `analyzeFoodWithDoubao(base64)`，走豆包 API。
     - 返回结构包含 AI 分析结果 + `data:image/jpeg;base64,...` 的图片字段。
   - 分析结果页面：`app/analysis/page.tsx`
     - 从 `sessionStorage.analysisResult` 读取刚刚的分析结果，支持份量倍数调整。
     - 使用 `mealsService.addMeal` 将结果持久化到 Supabase 的 `user_meals`（包含宏量与部分微量营养素字段，以及 `ingredients`、`confidence`）。

3. **每日概览与餐食明细**
   - 首页：`app/page.tsx`
     - 首先通过 `authService.getSession()` 检查登录，未登录则重定向到 `/auth`。
     - 使用 `mealsService.getMealsByDate(date)` 调用 `GET /api/meals?date=YYYY-MM-DD`。
     - 后端聚合：`/api/meals` 中查询 `user_meals` + `user_profiles`，按日期返回所有餐食；前端进行分组和统计剩余卡路里、三大营养素进度。
     - 支持删除餐食：前端调用 `DELETE /api/meals/:id`。
   - 餐食详情：`app/meal/[id]/page.tsx`
     - 前端通过 `GET /api/meals/:id` 查询单条记录，展示宏量营养素分布与详细营养信息。

4. **趋势分析与个人中心**
   - 趋势分析：`app/analytics/page.tsx`
     - 使用 `analyticsService.getAnalytics(timeframe)` 调用 `GET /api/analytics`，按「本周 / 上周 / 本月」返回 `dailyData` 和统计指标。
     - 图表展示使用 Recharts（折线 + 柱状 + 饼图）。
   - 个人中心：`app/profile/page.tsx`
     - 从 `authService.getCurrentUser()` 和 `localStorage.user` 组合展示用户名、连续天数等（部分字段暂为占位）。
     - 菜单项跳转到多条尚未实现的路由（如 `/achievements`、`/share`、`/settings` 等）。
   - 管理端登录记录：`app/admin/login-records/page.tsx`
     - 直接调用公开的 `GET /api/auth/login-records` 查看所有用户登录记录（手机号、IP、User-Agent），目前无任何前端/后端权限保护。

---

## 3. 上线评估与主要问题（Assessment & Gaps）

### 3.1 总体评估

- **功能完整度**：
  - 登录/注册、AI 扫描、营养分析、保存餐食、趋势分析、个人中心等核心功能均已打通，构建成功，交互和视觉也达到可用水平。
- **技术风险**：
  - TypeScript 构建错误被忽略（`next.config.mjs`），可能隐藏类型问题。
  - 使用 Supabase Service Role 的接口（登录、登录记录查询）暴露在公开 API 下，需要谨慎保护。
  - 图片以 base64 直接存入数据库（字段名为 `image_url`），短期可接受，但长期会放大存储和带宽成本。
- **安全与隐私**：
  - `/api/auth/login-records` + `/admin/login-records` 目前对任何访问者开放所有登录记录，是隐私和合规上的**高风险**。
  - `/api/analyze` 不做任何鉴权或限流，在公开环境下可能导致 Doubao API 被滥用（成本不可控）。
- **体验与产品边界**：
  - 未登录用户访问 /scan /analysis 等页面时，部分操作只会在控制台报错或弹出通用 alert，缺乏清晰提示。
  - Profile 菜单中存在多条尚未实现的路由，点击后会 404，影响 MVP 体验感知。

综合来看：
- **作为小规模内测（封闭用户）MVP：可以上线，但建议至少先解决登录记录暴露和基础鉴权问题。**
- **作为公开可访问的 MVP：需要补齐安全/隐私和产品边界控制后，再正式对外推广。**

---

## 4. 建议的改进方向与实施步骤（Proposed Changes）

> 下列改动按优先级分为「上线前必须完成」和「上线后迭代」。本计划只做设计，不直接改代码，待你确认后再逐项实现。

### 4.1 上线前必须完成（Blockers）

1. **保护登录记录接口和管理页面**  
   - 影响范围：`app/admin/login-records/page.tsx`、`app/api/auth/login-records/route.ts`。
   - 问题：当前任何人都可以访问登录记录（手机号 + IP + UA），且接口使用 Service Role Key，绕过 RLS。
   - 建议：
     - MVP 阶段**最简单做法**：直接从路由树中移除 `admin/login-records` 页面和对应 API 路由（仅保留在单独分支或内部工具）。
     - 或者增加非常明确的权限校验，例如：
       - 使用环境变量 `ADMIN_DASHBOARD_TOKEN`，要求请求头携带 `x-admin-token` 才返回数据；
       - 后续再接入基于 Supabase Auth 的角色权限。

2. **梳理 Supabase 环境变量与数据库结构**  
   - 影响范围：`lib/supabase.ts`、`app/api/auth/*`、`app/api/meals/*`、`app/api/analytics/route.ts`、`migrations/*`。
   - 必要环境变量：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DOUBAO_API_KEY`
     - 可选：`USE_MOCK_ANALYSIS`（开发环境）。
   - 建议：
     - 在 README 中单独增加「Supabase 配置」小节，列出所有必须的环境变量及其用途。
     - 确认线上数据库已执行 `migrations/add_nutrition_details.sql`，保证 `user_meals` 字段与代码中的 insert/select 完全匹配。
     - 检查 `user_profiles`、`user_login_records` 的表结构与 API 使用字段（如 `phone`、`username`、`daily_calorie_goal` 等）一致。

3. **收紧 /api/analyze 的调用边界与参数校验**  
   - 影响范围：`app/api/analyze/route.ts`、`app/scan/page.tsx`。
   - 问题：
     - 当前后端只假设前端已经做了 10MB 限制，没有服务器端的大小和类型校验。
     - 接口对未登录用户完全开放，在公开环境下可能被刷接口消耗 Doubao 配额。
   - 建议：
     - 在 `POST /api/analyze` 内增加二次校验：
       - 校验 `imageFile.size`（可通过 `arrayBuffer.byteLength` 估算），大于阈值（如 5–8MB）直接拒绝。
       - 校验 `imageFile.type` 必须以 `image/` 开头。
     - 收紧权限：至少要求用户已登录（前端通过 `authService.getSession` + 携带 Bearer token；后端根据 token 解析用户，或简单校验 token 存在即可）。
       - 若短期不想做服务端解析 token，可以保持接口对未登录用户开放，但明确设置 **速率限制策略**（例如先在 Vercel 上增加保护或改日接入简单的 IP 级限流）。

4. **处理未登录用户的关键路径体验**  
   - 影响范围：`app/scan/page.tsx`、`app/analysis/page.tsx`、`lib/supabase.ts`（`mealsService.addMeal`、`analyticsService.getAnalytics`）。
   - 问题：
     - 未登录访问 /scan：可以执行 AI 分析，但保存餐食时抛出「未登录」异常，仅以 `alert` 告知，体验生硬。
     - 未登录访问 /analytics：接口层抛出 Error("未登录")，页面只显示「加载失败，请稍后重试」，不提示需要登录。
   - 建议：
     - 在 /scan 和 /analysis 顶部增加登录检测：未登录时只允许体验 AI 分析，但在保存按钮处明确显示「登录后可保存到今日记录」并引导到 `/auth`。
     - 在 `AnalyticsPage` 的错误处理里增加针对「未登录」的分支：提示「请先登录以查看历史统计」，并给出「去登录」按钮。

5. **移除或隐藏尚未实现的菜单项/路由**  
   - 影响范围：`app/profile/page.tsx` 中的菜单项（如 `/achievements`、`/share`、`/notifications`、`/privacy`、`/settings`、`/help`）。
   - 问题：这些路由目前不存在，点击后 404，会让早期用户误以为功能异常，而不是「尚未开放」。
   - 建议：
     - MVP 阶段只保留「退出登录」+ 少数你确定要做的入口；
     - 或者为每个路由制作一个极简「建设中」页面（纯文案 + 返回按钮），确保不会 404。

### 4.2 上线后可迭代的高优先优化

6. **恢复类型检查，避免潜在运行时问题**  
   - 影响范围：`next.config.mjs`、全局 TypeScript。
   - 当前配置：
     - `next.config.mjs` 第 3–5 行：
       - `typescript.ignoreBuildErrors: true`。
   - 建议：
     - 在本地运行 `npx tsc --noEmit`，整理并修复主要类型问题。
     - 修复完成后，将 `ignoreBuildErrors` 改为 `false`，让 CI/构建阶段可以拦截类型问题。

7. **数据存储与图片处理策略**  
   - 影响范围：`app/api/analyze/route.ts`、`app/analysis/page.tsx`、`user_meals.image_url` 字段。
   - 问题：当前直接将 `data:image/jpeg;base64,...` 存为 `image_url`，对少量数据尚可，但随着用户和图片增多，会导致：
     - 数据库行体积过大，查询和备份成本上升。
     - 前端加载历史餐食图片时网络负担较重。
   - 建议：
     - 保持现状作为 MVP 的折中方案，但在路线图中明确：
       - 后续将图片上传至 Supabase Storage / S3，`image_url` 字段仅存地址。
       - 在 `ScanPage` 或后端增加简单的图片压缩（限制分辨率和质量），降低传输和存储开销。

8. **统一错误处理与提示文案**  
   - 影响范围：所有 `alert(...)` 和 `console.error` 的位置，例如：
     - `app/page.tsx`（删除失败）、`app/analysis/page.tsx`（保存失败）、`app/scan/page.tsx`（分析失败）。
   - 建议：
     - 使用已有的 `hooks/use-toast.ts` 封装轻量的全局提示组件，在失败时给出一致的错误提示样式与文案。
     - 针对典型错误场景（网络错误、AI 超时、未登录）定义清晰的用户文案。

### 4.3 中长期优化（可排到 v1.1+）

9. **更完整的权限与角色体系**  
   - 在 Supabase 中为用户增加角色字段（普通用户 / 管理员），并在后端 API 中根据 JWT Claims 控制访问。
   - 将所有使用 Service Role 的接口收敛到仅内部管理用途，对外 API 只使用 Anon Key + RLS。

10. **可观测性与监控**  
    - 当前已有 `PerformanceMonitor`（`components/performance-monitor.tsx`）和 Vercel Analytics，仅在开发环境输出调试信息。
    - 后续可接入简单的 error reporting（如 Sentry）捕获前端和 API 异常，便于线上问题排查。

11. **测试与发布流程**  
    - 为关键业务（登录、AI 分析、保存餐食、趋势接口）添加基础集成测试或 e2e 测试。
    - 在 CI 中增加步骤：`npm run lint` + `npx tsc --noEmit` + （可选）测试，通过后自动部署到预览环境，再手动 promote 到生产。

---

## 5. 下一步（Next Steps）

一旦你确认以上评估和改动方向，我建议按以下顺序实施：

1. **安全优先**：先下线或保护 `/admin/login-records` 与 `/api/auth/login-records`，并补上 `/api/analyze` 的参数校验与（至少部分）鉴权逻辑。
2. **体验边界**：整理未登录用户的流转（提示 + 引导登录），隐藏未实现的菜单项，确保「用户能看到的都能正常用」。
3. **文档与环境**：补充 README 中的 Supabase/豆包配置说明，确认线上 DB 已执行迁移。
4. **再评估**：完成上述收尾后，再评估是否要在上线当下立即打开严格的 TypeScript 校验，以及是否要在图片存储和成本控制上做进一步优化。

> 当前计划文档只描述目标和改动方向，不包含具体实现；待你确认后，可以逐项拆成开发任务来落地。