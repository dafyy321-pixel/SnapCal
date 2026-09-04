import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

test("目标设置覆盖训练条件与饮食限制", () => {
  const source = readFileSync(join(process.cwd(), "app/profile/goals/page.tsx"), "utf8")
  for (const field of ["training_days_goal", "training_experience", "available_equipment", "dietary_preferences", "allergies"]) assert.match(source, new RegExp(field))
  assert.match(source, /min=\{1\} max=\{7\}/)
})

test("AI 设置仅展示脱敏状态并支持撤回同意", () => {
  const source = readFileSync(join(process.cwd(), "app/profile/ai/page.tsx"), "utf8")
  assert.match(source, /\/api\/ai\/status/)
  assert.match(source, /ai_consent_at: consented \? new Date\(\)\.toISOString\(\) : null/)
  assert.match(source, /撤回后，服务端立即停止外部 AI 请求/)
  assert.doesNotMatch(source, /DOUBAO_API_KEY|OPENAI_API_KEY|apiKey/)
})
