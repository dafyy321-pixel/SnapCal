<div align="center">

<img src="./public/logo.png" alt="SnapCal Logo" width="120" />

<h1>SnapCal</h1>

<p>AI 辅助的饮食与训练记录应用</p>

拍照记录一餐，记下训练和身体状态，在同一条时间线上回顾每天的变化。

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-local-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13-339933?style=flat-square&logo=node.js)](https://nodejs.org/)

[功能特性](#features) • [快速开始](#quick-start) • [AI 配置](#ai-configuration) • [项目结构](#project-structure) • [部署指南](#deployment) • [API 文档](#api-documentation)

</div>

---

## 📖 项目简介

SnapCal 从拍照识别食物和营养记录出发，将训练、每日状态和身体指标放到一起。你可以查看当天的热量与三大营养素摄入，记录一次力量或有氧训练，也可以只花一点时间记下精力、饥饿感、酸痛和睡眠。

首页会根据已有记录给出一项当天可执行的行动。数据积累后，可以在综合洞察中回顾最近 7 天或 30 天的变化，并选择是否开展一项为期一周的小尝试。

当前版本采用 **本地单用户** 模式，使用 Node.js 内置 SQLite 保存数据，图片保存在本地目录。无需注册账号或配置数据库服务，安装后即可手动记录；配置兼容的 AI 服务并同意数据发送说明后，可以使用拍照识别和 AI 辅助建议。

### 适用场景

- 🥗 **日常饮食记录**：拍照或手动记录餐食，查看热量、蛋白质、碳水化合物和脂肪摄入。
- 💪 **训练记录**：保存动作、组次和训练感受，复用模板或上次训练。
- 🌤️ **状态观察**：结合睡眠、精力、饥饿感和酸痛，回顾自己的日常状态。
- 📊 **个人健康复盘**：把饮食、训练和身体指标放在同一周期中查看。
- 💻 **本地使用与开发**：在自己的电脑上运行，直接管理数据库、图片和备份。

> 💡 AI 营养数据是图片估算结果，份量、烹饪用油和遮挡都会影响准确性。保存前请核对食物和份量；有包装标签或称重数据时，可以通过手动记录填写。

---

<a id="features"></a>

## ✨ 功能特性

### 📸 饮食记录与营养分析

- 支持拍照或上传食物图片，识别食物名称、主要食材和营养信息。
- 展示热量及三大营养素；识别结果包含时，可查看膳食纤维、钠等详细营养素。
- 支持 0.5～3 倍份量调整，按倍率更新营养数值。
- 按早餐、午餐、晚餐和加餐保存记录，支持查看、修改和删除。
- 支持手动创建餐食，无需 AI 配置。
- 对相同图片和模型复用已有分析结果，减少重复请求。

### 🏋️ 训练与模板

- 支持力量、有氧、活动度、运动和其他训练类型。
- 记录动作、组次、重量、次数、时长、距离，以及 RPE（主观用力程度）。
- 区分计划中、进行中、已完成和已跳过的训练。
- 内置六个模板：居家全身基础、健身房全身基础、上肢基础、下肢基础、20 分钟稳定有氧、10 分钟活动与拉伸。
- 支持自定义模板、复制模板和复制上次训练，减少重复填写。

### 🌤️ 每日状态与身体指标

- 记录精力、饥饿感、酸痛、睡眠时长和睡眠质量。
- 按日期记录体重、腰围和可选体脂率。
- 在统一时间线中查看餐食、训练、状态和身体指标，并按类型筛选。
- 在目标设置中维护营养目标、每周训练天数、训练经验、可用器械和饮食限制。

### 🎯 今日行动与食物助手

- 今日行动先由本地规则生成候选，再由可选 AI 选择和解释。
- 结合当天记录、近期训练和当前状态，给出一项可执行的行动。
- 食物助手支持日常搭配、训练前和训练后场景，先识别食材，再由用户确认。
- 提供主方案和替代方案；生成餐食草稿后，需要确认营养数据才能保存。
- AI 不可用时，今日行动可使用本地规则；已有食材会话在确认食材后，也可使用本地搭配建议。

### 📈 综合洞察与周度尝试

- 查看最近 7 天或 30 天的营养、训练、状态和身体指标。
- 汇总完成训练次数、训练时长、力量组数、训练量等数据。
- 饮食日均值按有记录的天数计算，未记录的日期不会当作零摄入。
- 记录不足时说明缺少哪些数据，不凭少量记录判断趋势或因果关系。
- 满足记录条件后提出周度尝试，由用户确认后开始。

### 💾 本地数据与导出

- SQLite 保存记录，上传图片保存在项目本地目录。
- 支持 JSON 导出和按类别导出的 CSV，时间范围可选最近 7 天、最近 30 天或全部。
- AI 数据发送需要单独同意，支持随时撤回。
- 中文界面、底部导航和快捷新增入口，采用移动端优先的布局。

---

## 🛠️ 技术栈

| 层次 | 技术 | 用途 |
| --- | --- | --- |
| 应用框架 | Next.js 16.3、React 19.2、TypeScript 5 | App Router 页面、服务端 API 和类型检查 |
| UI 与样式 | Tailwind CSS 4.1、shadcn/ui、Radix UI、Lucide | 页面布局、交互组件和图标 |
| 表单与校验 | React Hook Form、Zod | 表单处理、请求和模型输出校验 |
| 本地存储 | Node.js `node:sqlite`、本地文件系统 | 健康记录、分析结果和图片 |
| 数据展示 | Recharts、date-fns | 图表和日期处理 |
| AI 接入 | 原生 `fetch`、Chat Completions 兼容接口 | 图片识别、行动解释和食材搭配 |
| 开发验证 | ESLint、TypeScript、Node.js Test Runner、tsx、Testing Library | 静态检查、业务和界面行为测试 |

具体依赖和命令见 [package.json](./package.json)。AI 调用不依赖 OpenAI SDK；旧版豆包配置仍保留兼容入口。

---

<a id="quick-start"></a>

## 🚀 快速开始

### 环境要求

- **Node.js 22.13 或更高版本**，需要支持内置 `node:sqlite`。
- **npm**，使用仓库中的 `package-lock.json` 安装依赖。
- 可写入的项目目录，用于创建本地数据库和保存图片。

### 1. 获取项目并安装依赖

```bash
git clone https://github.com/dafyy321-pixel/SnapCal.git
cd SnapCal
npm ci
```

### 2. 启动应用

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。默认只监听 `127.0.0.1`，在运行 SnapCal 的电脑上访问。

首次访问数据 API 时，会自动创建数据库、初始化资料和训练模板。手动记录无需配置 AI，也不需要运行额外的数据库迁移命令。

```text
data/
├── snapcal.db       # SQLite 数据库
└── uploads/         # 上传的食物图片，保存图片时创建
```

数据库、SQLite 辅助文件和上传目录已加入 Git 忽略规则。

### 3. 完成第一次记录

1. 在“我的 → 目标设置”填写适合自己的营养和训练目标。
2. 从快捷新增入口选择手动餐食，或配置 AI 后拍照识别一餐。
3. 从训练模板开始一次训练，填写实际完成的动作和组次。
4. 在状态打卡中记录当天感受，按需补充身体指标。
5. 回到首页查看当天摘要和今日行动；后续可在记录页和综合洞察中回顾。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器，监听 `127.0.0.1` |
| `npm run env:check` | 检查视觉和文本 AI 是否已配置，不验证远端服务连通性 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm test` | 运行现有测试 |
| `npm run build` | 生成生产构建 |
| `npm run build:check` | 先检查类型，再执行生产构建 |
| `npm start` | 启动已构建的生产服务器，监听 `127.0.0.1` |
| `npm audit --omit=dev` | 检查生产依赖的已知漏洞 |

---

<a id="ai-configuration"></a>

## 🤖 AI 配置

### 基础配置

在项目根目录新建 `.env.local`，填写以下内容：

```dotenv
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=replace-with-your-server-side-key
OPENAI_MODEL=replace-with-a-chat-completions-model
```

将示例值替换为服务商提供的地址、密钥和模型名称。图片识别所用模型需要支持图片输入；API 根地址应保留服务商要求的版本路径，**不要在末尾加 `/chat/completions`**，程序会自动追加。

修改后重启应用，运行 `npm run env:check` 检查配置，再到“我的 → AI 设置”阅读数据发送说明并同意。密钥只在服务端读取，不要使用 `NEXT_PUBLIC_` 前缀存放密钥。

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `OPENAI_API_BASE_URL` | `https://api.openai.com/v1` | Chat Completions 兼容 API 根地址，末尾斜杠会被移除 |
| `OPENAI_API_KEY` | 空 | 服务端 API 密钥 |
| `OPENAI_MODEL` | 空 | 视觉和文本任务共用的基础模型 |
| `OPENAI_VISION_MODEL` | `OPENAI_MODEL` | 可选，单独指定支持图片输入的模型 |
| `OPENAI_TEXT_MODEL` | `OPENAI_MODEL` | 可选，单独指定文本建议模型 |
| `AI_REQUEST_TIMEOUT_MS` | `30000` | 请求超时，限制在 1000～120000 毫秒 |
| `USE_MOCK_ANALYSIS` | `false` | 开发和测试用的确定性模拟分析，生产模式不启用 |
| `DOUBAO_API_KEY` | 空 | 旧版豆包配置兼容；未设置通用密钥时启用 |

可以分别配置视觉和文本模型：

```dotenv
OPENAI_VISION_MODEL=your-vision-model
OPENAI_TEXT_MODEL=your-text-model
AI_REQUEST_TIMEOUT_MS=60000
```

如果只有 `DOUBAO_API_KEY`，程序使用 `https://ark.cn-beijing.volces.com/api/v3` 和既有模型 `doubao-seed-1-6-flash-250828`；视觉、文本模型覆盖项仍可生效。设置 `OPENAI_API_KEY` 后，通用配置优先，此时需要配置通用模型或对应的模型覆盖项。

### 未配置 AI 时的行为

| 功能 | 是否需要 AI |
| --- | --- |
| 手动餐食、训练、模板、状态、身体指标 | 不需要 |
| 时间线、统计、综合洞察、数据导出 | 不需要 |
| 今日行动 | 本地规则可运行，AI 用于选择和解释候选 |
| 食材搭配建议 | 已有会话确认食材后，可使用本地规则 |
| 新图片的餐食识别、食材识别 | 需要视觉模型和用户同意；开发模拟模式除外 |

缺少密钥或对应模型时，图片识别会提示“AI 服务尚未配置”，不会自动生成演示营养结果。AI 超时或调用失败时，页面会显示错误；可继续使用手动记录。

### 请求处理

- 使用 `/chat/completions` 消息格式，通过原生 `fetch` 发送请求。
- 遇到 429 或 5xx 最多重试一次；400、401、403 不重试。
- 模型结果先提取 JSON，再通过 Zod 校验，格式不合格的结果不会直接作为有效业务数据保存。
- 外部 AI 调用限制为同时最多 2 个请求、每小时最多发送 20 次；计数保存在当前服务进程内。

---

## 🧩 核心功能详解

### 1. 拍照记录一餐

```text
拍照或选择图片
    ↓
服务端校验图片、AI 配置和用户同意
    ↓
复用已有分析，或调用视觉模型
    ↓
校验结果并展示食物、营养和置信度
    ↓
用户核对份量、选择餐次
    ↓
保存为餐食记录
```

支持 JPEG、PNG、WebP 和 GIF，单张图片最大 5 MB。识别结果与已保存餐食分开管理，看到分析结果后仍需点击保存。

份量调整按 `调整后数值 = 原始数值 × 份量倍率` 计算。它只能缩放估算值，无法纠正食物种类或烹饪方式识别错误；遇到这种情况，可重新识别或手动记录。

### 2. 用已有食材安排一餐

在扫描页选择食材搭配模式，或从相关行动进入训练前后食物助手。识别完成后先确认、修正可见食材，再生成搭配方案。

建议会结合场景、距训练的时间、已记录的营养和饮食限制。照片无法确定精确克数时，助手会保留不确定性。转换为餐食草稿后，需要补充并确认热量和宏量营养数据，再保存到记录中。

### 3. 今日行动如何产生

本地规则根据当天记录、近期训练、目标和状态生成候选。启用 AI 后，模型只能从这些候选中选择并说明原因，不能直接修改记录或训练计划。没有 AI 时，应用仍可按本地规则给出行动。

应用不计算“运动抵消食物”，不会因为跳过训练而建议削减下一餐，也不提供疾病诊断、伤病判断、药物或补剂剂量。

### 4. 周度尝试何时出现

最近 7 天至少有 **4 天饮食记录、2 次已完成训练和 3 次状态打卡** 时，应用可以提出一项周度尝试。条件不足时会列出缺少的记录。

尝试需要用户确认后开始，用于观察一项小调整期间的记录变化。综合洞察中的同期变化不代表因果关系，也不会自动改动你的目标或训练安排。

---

<a id="project-structure"></a>

## 📁 项目结构

```text
SnapCal/
├── app/                         # 页面与 API
│   ├── page.tsx                 # 首页：今日行动和当天摘要
│   ├── records/                 # 统一记录时间线
│   ├── scan/                    # 餐食识别、食材识别
│   ├── analysis/                # 餐食识别结果
│   ├── meal/[id]/               # 已保存餐食详情
│   ├── meals/new/               # 手动餐食
│   ├── workouts/                # 新建训练与训练详情
│   ├── templates/               # 训练模板
│   ├── check-in/                # 每日状态
│   ├── body-metrics/            # 身体指标
│   ├── food-assist/[id]/        # 食材确认、搭配与餐食草稿
│   ├── analytics/               # 综合洞察与周度尝试
│   ├── profile/                 # 资料、目标、AI 设置、导出与帮助
│   └── api/                     # 本地数据和 AI 接口
├── components/                  # 页面共用组件
│   ├── ui/                      # shadcn/ui 基础组件
│   ├── bottom-nav.tsx           # 底部导航与快捷新增入口
│   └── workout-form.tsx         # 训练表单
├── lib/
│   ├── local-db.ts              # SQLite 初始化、迁移和餐食数据
│   ├── wellness-db.ts           # 训练、状态、身体指标等数据操作
│   ├── validation-schemas.ts    # 资料和餐食校验
│   ├── wellness-schemas.ts      # 训练和健康记录校验
│   ├── ai-config.ts             # AI 配置、食物提示词和结果校验
│   ├── openai-client.ts         # 通用 AI 请求、同意检查和运行摘要
│   ├── action-engine.ts         # 今日行动规则和候选选择
│   ├── food-assist-service.ts   # 食材识别与搭配建议
│   ├── insights-service.ts      # 综合洞察与周度尝试
│   ├── export-service.ts        # JSON 和 CSV 导出
│   ├── local-images.ts          # 本地图片读写
│   ├── request-security.ts      # 写请求来源和内容类型校验
│   └── date-utils.ts            # 日期与时区处理
├── tests/                       # 业务、API、界面行为和文档测试
├── scripts/check-env.ts         # AI 配置检查
├── docs/                        # 开发与验证记录
├── hooks/                       # 自定义 Hooks
├── types/                       # TypeScript 类型
├── public/                      # Logo 和静态资源
├── data/                        # 运行时生成的数据库和上传图片
├── proxy.ts                     # 请求代理入口
├── next.config.mjs              # Next.js 配置
├── package.json
└── README.md
```

---

## 🗺️ 页面路由说明

| 路由 | 用途 |
| --- | --- |
| `/` | 今日行动、日期切换和当天饮食、训练、状态摘要 |
| `/records` | 统一时间线与类型筛选 |
| `/scan` | 餐食拍照识别 |
| `/scan?mode=inventory` | 食材识别与搭配入口 |
| `/analysis?id=…` | 查看识别结果、调整份量并保存餐食 |
| `/meals/new`、`/meal/:id` | 手动餐食和已保存餐食详情 |
| `/workouts/new`、`/workouts/:id` | 新建、查看和编辑训练 |
| `/templates` | 内置和自定义训练模板 |
| `/check-in`、`/body-metrics` | 每日状态与身体指标，支持 `?date=YYYY-MM-DD` |
| `/food-assist/:id` | 确认食材、查看搭配和生成餐食草稿 |
| `/analytics` | 综合洞察与周度尝试 |
| `/profile`、`/profile/edit` | 个人中心与资料编辑 |
| `/profile/goals` | 营养与训练目标、器械和饮食限制 |
| `/profile/ai`、`/profile/export` | AI 状态、数据发送同意与数据导出 |
| `/profile/help`、`/profile/about` | 使用帮助与应用介绍 |

---

<a id="deployment"></a>

## 📦 部署指南

### 本机生产运行

安装依赖并完成可选的 `.env.local` 配置后：

```bash
npm run build
npm start
```

开发和生产命令都默认监听 `127.0.0.1`。生产运行同样需要支持 `node:sqlite` 的 Node.js 环境，以及持久、可写的数据库和图片目录。运行目录应保持一致，避免相对路径指向另一份数据。

构建时 `next/font/google` 会获取 Geist 字体，因此构建环境需要能够访问对应字体服务。

### 运行范围

当前版本面向一台受信任设备上的一位用户，没有账号和权限系统。能访问 Next.js 服务或项目 `data` 目录的人，也能访问其中的健康数据。

若需要远程访问，应在应用外层配置身份验证、TLS 和访问限制，再通过反向代理连接本机服务。仅放开监听地址并不能提供用户隔离。反向代理还需要正确传递请求主机信息，避免写请求被来源校验拒绝。

本地 SQLite 和上传目录需要持久化保存，当前架构不适合直接部署到使用临时文件系统的 Serverless 环境，也不能通过静态导出运行完整功能。容器部署时需要自行准备运行配置，并为数据库和图片挂载持久化目录。

### 数据路径与时区

以下变量可按需放入 `.env.local`：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SNAPCAL_DB_PATH` | `data/snapcal.db` | 覆盖数据库文件位置；跨目录启动时建议使用绝对路径 |
| `SNAPCAL_TIME_ZONE` | `Asia/Shanghai` | 服务端业务日期使用的时区 |
| `NEXT_PUBLIC_SNAPCAL_TIME_ZONE` | 未设置 | 浏览器端时区；自定义时应与服务端保持一致，公共值优先 |

例如：

```dotenv
SNAPCAL_TIME_ZONE=Asia/Shanghai
NEXT_PUBLIC_SNAPCAL_TIME_ZONE=Asia/Shanghai
```

修改浏览器端环境变量后，需要重新构建生产版本。`SNAPCAL_DB_PATH` 只改变数据库位置，图片仍保存在项目的 `data/uploads/`。

---

## 💾 数据、备份与恢复

### 应用内导出

在“我的 → 数据导出”选择时间范围和格式：

| 格式 | 内容 | 适合用途 |
| --- | --- | --- |
| JSON | 资料、餐食、训练动作与组次、状态、身体指标、行动卡和周度尝试 | 查看结构化数据或自行分析 |
| CSV | 餐食、训练与组次、状态、身体指标或周度尝试 | 用电子表格处理单类记录 |

时间范围为最近 7 天、最近 30 天或全部。CSV 中以 `= + - @` 开头的单元格会进行公式注入防护。

JSON 导出不包含图片文件、自定义训练模板和食物助手会话，当前也没有 JSON 导入恢复功能。导出适合查看和分析，完整恢复需要备份数据库及上传目录。

### 完整备份与恢复

1. 停止 SnapCal，避免复制过程中数据库仍在写入。
2. 复制整个 `data` 目录到安全位置，保留数据库、可能存在的 SQLite 辅助文件和 `uploads` 图片目录。
3. 若设置了 `SNAPCAL_DB_PATH`，同时备份该位置的数据库及相邻的 SQLite 辅助文件。
4. 恢复时先停止目标应用并保留其现有数据，再将备份放回对应位置。
5. 启动应用，检查餐食、训练、图片和导出功能。

数据库通过 `PRAGMA user_version` 执行增量迁移。更新应用前建议保留完整备份；迁移不会删除旧餐食字段或记录，但旧版程序未必能读取新版结构。

`.env.local` 不包含在应用内导出中。迁移到另一台电脑时，可单独重新配置 AI 密钥和自定义数据路径。

### 主要数据表

| 数据表 | 内容 |
| --- | --- |
| `user_profiles` | 个人资料、目标、器械、饮食限制与 AI 同意状态 |
| `user_meals` | 已保存餐食和营养数据 |
| `meal_analysis_results` | 食物识别结果、图片关联和分析缓存 |
| `workout_templates` | 内置和自定义训练模板 |
| `workout_sessions`、`workout_exercises`、`workout_sets` | 训练、动作与组次 |
| `daily_checkins`、`body_metrics` | 每日状态与身体指标 |
| `action_cards` | 今日行动与用户反馈 |
| `food_assist_sessions` | 食材确认、搭配建议和餐食草稿关联 |
| `weekly_experiments` | 周度尝试及状态 |
| `ai_runs` | AI 调用状态与运行摘要 |

---

## 🔒 AI 数据与隐私

### 数据发送与同意

用户必须先在“我的 → AI 设置”阅读说明并同意，服务端才会调用外部 AI。撤回同意后，外部 AI 请求立即停止。此前已经发送到服务商的数据不会因此自动删除。

根据具体任务，模型输入可能包含：

- 用户主动提交的当前图片，或已确认的食材列表。
- 当前建议所需的当日营养汇总。
- 最近七天训练数量和聚合表现，以及食物助手所关联训练的类型、强度等必要信息。
- 当前精力、饥饿、酸痛和睡眠数值。
- 用户已确认的器械、饮食限制和过敏信息。

模型输入不包含用户姓名、生日、头像路径、完整数据库、无关历史、原始自由文本备注或本地文件路径。API Key 仅用于服务端请求服务商时的认证，不放入提示词或前端响应。

`ai_runs` 只保存服务商、模型、状态、耗时、输入哈希、错误码、提示版本和可选 token 数，不保存完整提示词、Base64 图片或密钥。

### 本地保护

- 写请求检查来源和内容类型，JSON 业务字段由 Zod 校验。
- 上传图片检查大小、类型和内容，本地图片通过受限文件名访问。
- `.env.local`、本地数据库和上传图片已加入 Git 忽略规则。
- 当前应用没有内置数据库加密或多用户访问控制；本机权限和备份文件也需要妥善管理。

---

<a id="api-documentation"></a>

## 📝 API 文档

### 约定

API 面向本地单用户应用，不需要 JWT。浏览器写请求需要同源；JSON 请求使用 `Content-Type: application/json`，图片上传使用 `multipart/form-data`。

业务 API 使用统一 JSON 响应，本地图片接口直接返回图片内容：

```typescript
type ApiResponse<T> =
  | { success: true; data: T; timestamp: string }
  | {
      success: false
      error: { code: string; message: string; details?: unknown }
      timestamp: string
    }
```

日期使用 `YYYY-MM-DD`，餐食时间接受 `HH:mm` 或 `HH:mm:ss`。餐食热量单位为 kcal，蛋白质、碳水和脂肪单位为 g。请求字段以对应路由和 Zod Schema 为准。

### 接口一览

| 功能 | 接口 |
| --- | --- |
| 资料与当天摘要 | `GET/PUT /api/profile`、`GET /api/day` |
| 统一记录 | `GET /api/records` |
| 餐食 | `GET/POST /api/meals`、`GET/PATCH/DELETE /api/meals/:id` |
| 图片分析 | `POST /api/analyze`、`GET/PATCH/PUT /api/analysis/:id` |
| 训练 | `GET/POST /api/workouts`、`GET/PATCH/DELETE /api/workouts/:id` |
| 模板 | `GET/POST /api/workout-templates`、`POST/PATCH/DELETE /api/workout-templates/:id` |
| 每日状态 | `GET/PUT/DELETE /api/checkins/:date` |
| 身体指标 | `GET /api/body-metrics`、`GET/PUT/DELETE /api/body-metrics/:date` |
| 今日行动 | `GET /api/actions`、`POST /api/actions/generate`、`PATCH /api/actions/:id` |
| 食物助手 | `POST /api/food-assist`、`GET/PATCH /api/food-assist/:id`、`POST /api/food-assist/:id/meal-draft` |
| 营养统计与综合洞察 | `GET /api/analytics`、`GET /api/insights` |
| 周度尝试 | `GET/POST /api/experiments`、`PATCH /api/experiments/:id` |
| AI 状态与导出 | `GET /api/ai/status`、`GET /api/export` |
| 本地图片 | `GET /api/images/:name` |

模板的 `POST /api/workout-templates/:id` 用于复制模板；集合上的 `POST` 用于新建模板。

### 示例 1：识别食物图片

在应用同源页面中，将用户选择的 `File` 传入：

```typescript
async function analyzeFood(image: File) {
  const formData = new FormData()
  formData.append("image", image)

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  })
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || "识别失败")
  }

  return result.data // analysisId、data（识别结果）、file_warnings
}
```

不要手动设置 FormData 的 `Content-Type`，浏览器会生成带 boundary 的请求头。可用查询参数 `force_reanalyze=true` 强制重新分析；`use_mock=true` 仅在非生产环境生效。这些选项放在 URL 查询中，不是表单字段。

### 示例 2：手动创建餐食

`POST /api/meals` 的请求体示例，数值仅用于说明格式：

```json
{
  "meal_name": "番茄炒蛋",
  "meal_type": "lunch",
  "meal_date": "2026-09-08",
  "meal_time": "12:30:00",
  "calories": 180,
  "protein": 12.5,
  "carbs": 8.5,
  "fats": 11,
  "ingredients": ["番茄", "鸡蛋", "食用油"]
}
```

成功时返回 HTTP 201，餐食位于 `data.meal`。餐次支持 `breakfast`、`lunch`、`dinner`、`snack`。保存识别结果时可以附带 `analysis_id` 建立关联；手动记录不需要该字段。

`GET /api/meals` 支持 `date`、`meal_type`、`search`、`sort_by`、`sort_order`、`limit` 和 `offset`。响应包含 `profile`、`meals` 和 `pagination`。

### 示例 3：查询记录和导出

```text
GET /api/day?date=2026-09-08
GET /api/records?start_date=2026-09-01&end_date=2026-09-08&type=workout
GET /api/insights?timeframe=7d
GET /api/export?format=csv&range=month&category=workouts
```

`/api/records` 的 `type` 支持 `meal`、`workout`、`checkin`、`body_metric`；不传类型时返回全部类型。`/api/insights` 的周期支持 `7d`、`30d`。

`/api/export` 返回包含文件内容的 JSON 数据，由前端生成下载文件。`format` 支持 `json`、`csv`，`range` 支持 `week`、`month`、`all`；CSV 的 `category` 支持 `meals`、`workouts`、`checkins`、`body_metrics`、`experiments`。

### 常见错误

| 错误码 | 含义与处理 |
| --- | --- |
| `VALIDATION_ERROR` | 字段、日期或图片校验失败，检查请求格式和具体提示 |
| `NOT_FOUND` | 记录不存在，刷新列表后重新进入 |
| `CONFLICT` | 数据或活动状态冲突，检查是否重复提交 |
| `UNTRUSTED_ORIGIN` | 写请求来源不匹配，使用同源页面并检查代理配置 |
| `UNSUPPORTED_MEDIA_TYPE` | 请求内容类型错误 |
| `AI_NOT_CONFIGURED` | 缺少密钥或模型配置 |
| `AI_CONSENT_REQUIRED` | 尚未同意 AI 数据发送说明 |
| `AI_BUSY`、`AI_RATE_LIMITED` | AI 并发或发送次数达到限制，稍后再试 |
| `AI_TIMEOUT` | AI 请求超时，检查网络、服务状态和超时配置 |
| `AI_INVALID_JSON`、`AI_SCHEMA_ERROR` | 模型输出不符合要求，检查模型兼容性 |
| `AI_ANALYSIS_ERROR` | 食物分析失败，结合页面提示和服务端日志排查 |

具体路由可能将上游 AI 错误转换为业务错误，调用方应同时检查 HTTP 状态、`success` 和 `error.message`。

---

## 🔧 开发与测试

### 修改入口

- 新页面放在 `app/`，共用界面放在 `components/`，API 路由放在 `app/api/`。
- 数据写入逻辑放在 `lib/local-db.ts` 或 `lib/wellness-db.ts`，同时维护对应 Zod Schema。
- 食物提示词和结果格式在 `lib/ai-config.ts`；通用 AI 请求在 `lib/openai-client.ts`。
- 今日行动和食物搭配分别在 `lib/action-engine.ts`、`lib/food-assist-service.ts`。
- 全局样式与主题变量在 `app/globals.css`。

### 验证命令

```bash
npm run type-check
npm run lint
npm test
npm run build
```

现有测试覆盖本地数据库与迁移、API 参数、AI 配置和调用限制、日期边界、行动规则、训练表单、食物助手、导出及界面交互等行为。

### 使用模拟识别

在开发环境的 `.env.local` 中设置并重启开发服务器：

```dotenv
USE_MOCK_ANALYSIS=true
```

模拟模式使用确定性示例数据，适合检查上传、结果展示和保存流程，不验证真实模型的识别能力。测试结束后关闭该变量并清理测试记录。生产模式不启用模拟识别，也不会因为缺少密钥自动进入模拟模式。

手动验收时，可以依次检查：手动保存餐食、用模板记录训练、补充状态和身体指标、从时间线打开详情、切换洞察周期，以及导出 JSON/CSV。需要验证真实 AI 时，再配置模型并在应用内同意数据发送。

---

## 🐛 常见问题

### 提示找不到 `node:sqlite`，或数据库无法打开？

先运行 `node --version`，确认实际启动应用的 Node.js 不低于 22.13。再检查项目目录或 `SNAPCAL_DB_PATH` 指向的目录是否可写，以及是否从预期的项目目录启动。当前版本使用 SQLite，无需配置 Supabase。

### 配置了密钥，仍提示 AI 未配置或不能识别？

运行 `npm run env:check`，分别检查视觉和文本配置。确认模型名称不为空、视觉模型支持图片输入、根地址没有重复的 `/chat/completions`，并在修改 `.env.local` 后重启应用。还需要在“我的 → AI 设置”同意数据发送；本地配置检查不会验证密钥余额、模型权限或服务商网络状态。

### 上传图片失败，或营养结果与实际不符？

使用 5 MB 以内的 JPEG、PNG、WebP 或 GIF；HEIC、SVG 等格式需先转换。尽量让主要食物清晰入镜，减少遮挡。份量倍率适合修正食量，无法修正错误的食物类型；需要准确填写时可参考包装标签或手动输入。

### 扫描结果没有出现在饮食记录中？

识别结果需要确认并保存后才会成为餐食记录。食物助手生成的草稿也需要补充和确认营养数据。回到对应结果页检查是否已保存，以及餐食日期是否正确。

### 首页日期或跨天记录不一致？

默认业务时区为 `Asia/Shanghai`。如果自定义时区，请同时设置 `SNAPCAL_TIME_ZONE` 和 `NEXT_PUBLIC_SNAPCAL_TIME_ZONE` 为相同值，并重新构建生产版本。

### 手机为什么不能直接访问电脑上的 SnapCal？

默认服务只监听电脑本机的 `127.0.0.1`，手机上的 `localhost` 指向手机自身。跨设备访问需要额外的网络和访问控制配置，详见[部署指南](#deployment)。移动端优先指界面布局，不代表默认开放局域网访问。

### JSON 导出能否直接恢复全部数据？

当前没有 JSON 导入功能，JSON 导出也不含图片和部分辅助记录。需要迁移或完整恢复时，应停止应用并备份整个 `data` 目录；自定义数据库路径还需另行备份。

### 构建失败怎么办？

先检查 Node.js 版本，运行 `npm ci` 安装锁定依赖，再运行 `npm run type-check` 和 `npm run build`。若日志指向 Geist 或 Google Fonts 下载失败，检查构建环境访问字体服务的网络连接。

---

## 🚧 当前限制

- 当前为本地单用户应用，没有多用户账号、云端同步或内置远程访问控制。
- 图片营养识别依赖模型估算，不保证每项食物、份量和微量营养素都能正确识别。
- 使用本地记录时仍需启动 Next.js 服务，尚未提供可独立离线运行的 PWA。
- AI 图片识别需要可访问所配置服务商的网络；关闭 AI 后，本地记录和统计仍可使用。
- 尚无 JSON 导入、自动备份、PDF 导出或健康平台同步功能。
- 仓库包含主题相关依赖和样式基础，但当前没有完整接入的用户主题切换入口。

---

## 🤝 贡献指南

欢迎提交问题、改进文档或通过 Pull Request 贡献代码。

1. Fork 仓库，从目标基线创建工作分支。
2. 完成修改，并为行为变更补充必要的验证。
3. 按修改范围运行类型检查、Lint、测试和构建。
4. 提交 Pull Request，说明解决的问题、使用方式和验证结果。

问题反馈请附上复现步骤、Node.js 版本和相关错误信息。提交前检查是否包含 API Key、个人健康记录或食物图片，避免把本地数据带入仓库。

---

## 📚 相关资源与致谢

- [Next.js](https://nextjs.org/docs) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [Lucide](https://lucide.dev/)
- [Recharts](https://recharts.org/) · [SQLite](https://www.sqlite.org/docs.html)
- [Node.js SQLite 文档](https://nodejs.org/api/sqlite.html) · [豆包服务](https://www.volcengine.com/product/doubao)

感谢这些开源项目，以及参与反馈和改进 SnapCal 的贡献者。

## 📮 项目与反馈

- **项目主页**：[dafyy321-pixel/SnapCal](https://github.com/dafyy321-pixel/SnapCal)
- **问题与功能建议**：[GitHub Issues](https://github.com/dafyy321-pixel/SnapCal/issues)
- **代码贡献**：[Pull Requests](https://github.com/dafyy321-pixel/SnapCal/pulls)

## 📄 许可证

当前仓库未包含独立的 `LICENSE` 文件，许可条款尚待维护者明确。

---

<div align="center">

**用 ❤️ 和 ☕ 制作**

[GitHub](https://github.com/dafyy321-pixel/SnapCal) • [问题反馈](https://github.com/dafyy321-pixel/SnapCal/issues) • [参与贡献](https://github.com/dafyy321-pixel/SnapCal/pulls)

</div>
