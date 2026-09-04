import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

test("综合洞察页覆盖四类记录和用户确认式周度尝试", () => {
  const source = readFileSync(join(process.cwd(), "app/analytics/page.tsx"), "utf8")
  assert.match(source, /\/api\/insights\?timeframe=/)
  assert.match(source, /营养[\s\S]*训练[\s\S]*状态[\s\S]*身体指标[\s\S]*观察模式/)
  assert.match(source, /确认开始/)
  assert.match(source, /保存修改/)
  assert.match(source, /跳过/)
  assert.match(source, /结束并记录/)
  assert.match(source, /不作因果判断/)
  assert.doesNotMatch(source, /恢复总分|健康总分|训练抵消|少吃下一餐/)
})
