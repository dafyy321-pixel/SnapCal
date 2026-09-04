import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

test("README 与应用内说明匹配当前健康和 AI 行为", () => {
  const readme = readFileSync(join(process.cwd(), "README.md"), "utf8")
  const help = readFileSync(join(process.cwd(), "app/profile/help/page.tsx"), "utf8")
  const about = readFileSync(join(process.cwd(), "app/profile/about/page.tsx"), "utf8")
  for (const variable of ["OPENAI_API_BASE_URL", "OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_VISION_MODEL", "OPENAI_TEXT_MODEL", "AI_REQUEST_TIMEOUT_MS", "USE_MOCK_ANALYSIS", "DOUBAO_API_KEY"]) assert.match(readme, new RegExp(variable))
  assert.match(readme, /撤回同意后，外部 AI 请求立即停止/)
  assert.match(readme, /复制整个 `data` 目录/)
  assert.match(readme, /餐食、训练与组次、状态、身体指标或周度尝试/)
  assert.match(help, /未配置时不会生成虚假营养结果/)
  assert.match(about, /不把运动与饮食互相抵扣/)
  assert.doesNotMatch(`${readme}\n${help}\n${about}`, /未配置密钥时使用本地演示模式|未配置时自动使用本地演示结果/)
})
