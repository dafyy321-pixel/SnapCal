# SnapCal

SnapCal 是一个本地单用户健康记录应用，使用 Next.js 16、React 19 和 Node.js 内置 SQLite。它把饮食、训练、每日状态和身体指标放在同一条时间线上，并通过本地规则和可选 AI 给出一项当天可执行的行动。

核心功能：

- 拍照识别或手动记录餐食，保留热量和宏量营养数据。
- 记录力量、有氧、活动度、运动和其他训练，支持动作、组次、重量、次数、时长、距离和 RPE。
- 六个内置训练模板、自定义模板和复制上次训练。
- 精力、饥饿、酸痛、睡眠打卡，以及体重、腰围和可选体脂率记录。
- 今日行动卡、训练前后食物助手、综合洞察和需要用户确认的周度尝试。
- OpenAI Chat Completions 风格兼容接口；AI 不可用时，本地记录、统计和规则建议仍可运行。
- JSON 数据导出和餐食、训练、状态、身体指标、周度尝试分类 CSV。

## 运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。开发和生产命令默认只监听 `127.0.0.1`，不会把无登录保护的 API 暴露到局域网。

首次访问数据 API 时会自动创建：

- `data/snapcal.db`：资料、餐食、训练、状态、身体指标、行动卡、食物助手、实验和 AI 运行摘要。
- `data/uploads/`：用户上传的食物图片。

这两个路径已被 Git 忽略。数据库使用 `PRAGMA user_version` 做仅增量迁移；迁移不会删除旧餐食字段或记录。

## AI 配置

SnapCal 使用通用 `/chat/completions` 消息格式和原生 `fetch`，不依赖 OpenAI SDK。最低配置如下：

```text
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=replace-with-your-server-side-key
OPENAI_MODEL=replace-with-a-chat-completions-model
```

全部变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `OPENAI_API_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容 API 根地址，末尾斜杠会被移除 |
| `OPENAI_API_KEY` | 空 | 仅服务端读取的密钥 |
| `OPENAI_MODEL` | 空 | 视觉和文本任务的基础模型 |
| `OPENAI_VISION_MODEL` | `OPENAI_MODEL` | 可选视觉模型覆盖 |
| `OPENAI_TEXT_MODEL` | `OPENAI_MODEL` | 可选文本模型覆盖 |
| `AI_REQUEST_TIMEOUT_MS` | `30000` | 请求超时，实际限制为 1000～120000 毫秒 |
| `USE_MOCK_ANALYSIS` | `false` | 仅供开发和自动化测试显式启用确定性模拟分析 |
| `DOUBAO_API_KEY` | 空 | 旧配置兼容；未设置通用密钥时映射到 Ark 地址和既有豆包模型 |

通用 OpenAI 配置优先于 `DOUBAO_API_KEY`。429 和 5xx 最多重试一次，400、401、403 不重试。模型返回先提取 JSON，再经过 Zod 校验；格式不合格的数据不会写入数据库或直接展示。

没有密钥或模型时，拍照识别会明确返回“AI 服务尚未配置”，不会伪造营养结果。今日行动、统计、记录和本地食物搭配仍可使用。`USE_MOCK_ANALYSIS=true` 只应用于本地开发与测试，不应作为真实营养数据来源。

## AI 数据发送与同意

用户必须先在“我的 → AI 设置”阅读说明并同意，服务端才会调用外部 AI。撤回同意后，外部 AI 请求立即停止。

按任务最小化后可发送：

- 用户主动提交的当前图片。
- 当前建议所需的当日营养汇总。
- 最近七天训练数量和聚合表现。
- 当前精力、饥饿、酸痛和睡眠数值。
- 用户已确认的器械、饮食限制和过敏信息。

不会发送用户姓名、生日、头像路径、完整数据库、无关历史、原始自由文本备注、本地文件路径或 API Key。`ai_runs` 只保存服务商、模型、状态、耗时、输入哈希、错误码、提示版本和可选 token 数，不保存完整提示词、Base64 图片或密钥。

AI 只能在本地规则生成的行动候选中选择并解释，不能直接修改记录或训练计划。应用不计算“运动抵消食物”，不因跳过训练建议削减下一餐，也不提供疾病诊断、伤病判断、药物或补剂剂量。

## 数据、备份与恢复

当前版本面向一台受信任设备上的一位用户，没有账号和权限系统。能访问这个 Next.js 服务或项目 `data` 目录的人，也能访问其中的健康数据。不要直接部署到公网；若必须远程访问，应在应用外层增加可靠的身份验证、TLS 和访问限制。

应用内“我的 → 数据导出”支持：

- JSON：资料、餐食、训练动作与组次、状态、身体指标、行动卡和周度尝试。
- CSV：可单独选择餐食、训练与组次、状态、身体指标或周度尝试。以 `= + - @` 开头的单元格会进行公式注入防护。

完整备份或迁移时：

1. 停止 SnapCal，避免复制过程中数据库仍在写入。
2. 复制整个 `data` 目录到安全位置。
3. 恢复时先停止应用，再用备份目录替换目标项目的 `data` 目录。
4. 启动应用并检查餐食、训练、图片和导出功能。

JSON 导出不包含图片文件、自定义训练模板和食物助手会话，当前也没有 JSON 导入恢复功能。完整恢复需要数据库和 `data/uploads/`，请按上面的步骤备份整个目录。若设置了 `SNAPCAL_DB_PATH`，还需要备份该位置的数据库文件。

可用 `SNAPCAL_DB_PATH` 覆盖数据库文件位置，用 `SNAPCAL_TIME_ZONE` 覆盖默认的 `Asia/Shanghai` 时区。如果浏览器和服务端使用不同的构建环境，请同时设置 `NEXT_PUBLIC_SNAPCAL_TIME_ZONE`，保证日期归属一致。

## 常用命令

```bash
npm run type-check
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## 主要页面

- `/`：今日行动与当天饮食、训练、状态和身体摘要。
- `/records`：统一时间线与类型筛选。
- `/scan`：餐食识别或现有食材搭配。
- `/workouts/new`、`/workouts/:id`、`/templates`：训练和模板。
- `/check-in`、`/body-metrics`：状态和身体指标。
- `/analytics`：营养、训练、状态、身体指标、观察和周度尝试。
- `/profile/goals`、`/profile/ai`、`/profile/export`：目标、AI 同意和导出设置。

## 主要 API

- 资料和当天汇总：`GET/PUT /api/profile`、`GET /api/day`、`GET /api/records`
- 餐食和识别：`GET/POST /api/meals`、`GET/PATCH/DELETE /api/meals/:id`、`POST /api/analyze`、`GET/PATCH/PUT /api/analysis/:id`
- 训练和模板：`GET/POST /api/workouts`、`GET/PATCH/DELETE /api/workouts/:id`、`GET/POST /api/workout-templates`、`POST/PATCH/DELETE /api/workout-templates/:id`
- 状态和身体指标：`GET/PUT/DELETE /api/checkins/:date`、`GET /api/body-metrics`、`GET/PUT/DELETE /api/body-metrics/:date`
- 行动和食物助手：`GET /api/actions`、`POST /api/actions/generate`、`PATCH /api/actions/:id`、`POST /api/food-assist`、`GET/PATCH /api/food-assist/:id`、`POST /api/food-assist/:id/meal-draft`
- 洞察和尝试：`GET /api/insights`、`GET/POST /api/experiments`、`PATCH /api/experiments/:id`
- 设置和导出：`GET /api/ai/status`、`GET /api/export`
- 本地图片：`GET /api/images/:name`

API 除本地图片和错误下载内容外，统一返回 `{ success, data | error, timestamp }`。所有写接口在信任边界使用严格 Zod Schema；未知字段返回 400，不存在返回 404，活动冲突返回 409。
