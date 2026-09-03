import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("check-in and body metric screens", async t => {
  const checkin = readFileSync("app/check-in/page.tsx", "utf8")
  const metrics = readFileSync("app/body-metrics/page.tsx", "utf8")

  await t.test("keeps the required check-in to three score choices", () => {
    assert.match(checkin, /energy[\s\S]*hunger[\s\S]*soreness/)
    assert.match(checkin, /三次点击即可完成必填项/)
    assert.match(checkin, /aria-pressed/)
  })

  await t.test("makes sleep optional and supports deletion", () => {
    assert.match(checkin, /睡眠（可选）/)
    assert.match(checkin, /method: "DELETE"/)
  })

  await t.test("keeps body measurements separate", () => {
    assert.match(metrics, /体重 kg/)
    assert.match(metrics, /腰围 cm/)
    assert.match(metrics, /体脂率 %/)
    assert.doesNotMatch(metrics, /health_score|recovery_balance/)
  })
})
