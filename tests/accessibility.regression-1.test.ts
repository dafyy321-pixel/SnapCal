import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Regression: ISSUE-003 — icon-only settings controls had no accessible names
// Found by /qa on 2026-09-04
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-04.md
test("profile icon controls and numeric goals expose accessible names", () => {
  const goals = readFileSync(join(process.cwd(), "app/profile/goals/page.tsx"), "utf8")
  const help = readFileSync(join(process.cwd(), "app/profile/help/page.tsx"), "utf8")
  const about = readFileSync(join(process.cwd(), "app/profile/about/page.tsx"), "utf8")

  for (const label of ["返回", "保存目标", "减少当前体重", "增加当前体重", "减少目标体重", "增加目标体重", "每日卡路里目标", "每日蛋白质目标", "每日碳水目标", "每日脂肪目标"]) {
    assert.match(goals, new RegExp(`aria-label=(?:\"${label}\"|\\{\\\`${label}\\\`)`))
  }
  assert.match(goals, /htmlFor="current-weight"/)
  assert.match(goals, /id="current-weight"/)
  assert.match(goals, /htmlFor="target-weight"/)
  assert.match(goals, /id="target-weight"/)
  assert.match(goals, /aria-label=\{`每周\$\{getWeightGoalText\(\)\}目标`\}/)
  assert.match(help, /button aria-label="返回"/)
  assert.match(about, /button aria-label="返回"/)
})
