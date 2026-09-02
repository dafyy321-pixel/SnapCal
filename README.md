# SnapCal

SnapCal 是一个本地单用户的食物营养记录应用。它使用 Next.js 16、React 19 和 Node.js 内置 SQLite，没有登录或注册流程。

## 运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。开发和生产命令默认只监听本机回环地址，不会把未认证 API 暴露到局域网。首次访问数据 API 时会自动创建：

- `data/snapcal.db`：用户资料、餐食和 AI 分析结果
- `data/uploads/`：上传的食物图片

这两个路径已被 Git 忽略。可用 `SNAPCAL_DB_PATH` 覆盖数据库文件位置，用 `SNAPCAL_TIME_ZONE` 覆盖默认的 `Asia/Shanghai` 时区；如果浏览器和服务端使用不同的构建环境，请同时设置 `NEXT_PUBLIC_SNAPCAL_TIME_ZONE`，保证客户端日期显示一致。

## AI 分析

`DOUBAO_API_KEY` 是可选的：

```bash
DOUBAO_API_KEY=your-key
```

- 已配置：`POST /api/analyze` 调用豆包图像分析。
- 未配置：自动使用确定性本地演示结果，应用仍可完整运行。

图片限制为 5MB，支持 JPEG、PNG、WebP 和 GIF。服务端会校验文件头，使用 SHA-256 去重，数据库只保存本地图片 URL，不保存 Base64 副本。

## 数据和安全边界

当前版本面向一台受信任设备上的一位用户。所有 API 都不需要身份令牌；能访问该 Next.js 服务的人也能访问其中的健康数据。不要在公网直接暴露它，除非在外层增加受信任的访问控制。

导出页可以生成 JSON 或 CSV。要完整备份/迁移，请停止应用后备份整个 `data` 目录。

## 常用命令

```bash
npm run type-check
npm run lint
npm test
npm run build
npm audit --omit=dev
```

## 主要 API

- `GET/PUT /api/profile`
- `GET/POST /api/meals`（批量新增使用 `?batch=true`）
- `GET/PATCH/DELETE /api/meals/:id`
- `GET /api/analytics`
- `POST /api/analyze`
- `GET/PATCH/PUT /api/analysis/:id`
- `GET /api/images/:name`

API 统一返回 `{ success, data | error, timestamp }`。
