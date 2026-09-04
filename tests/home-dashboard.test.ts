import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("today dashboard", async t => {
  const source = readFileSync("app/page.tsx", "utf8")

  await t.test("loads the complete day contract", () => {
    assert.match(source, /\/api\/day\?date=/)
    for (const field of ["workouts", "checkin", "body_metric", "action_card"]) assert.match(source, new RegExp(field))
  })

  await t.test("shows one actionable card with expiry and feedback", () => {
    for (const text of ["今日行动", "有效至", "完成", "不适合", "稍后", "换一个"]) assert.match(source, new RegExp(text))
  })

  await t.test("keeps nutrition and exercise independent", () => {
    assert.doesNotMatch(source, /运动抵消|削减下一餐|热量余额|恢复债务/)
    assert.match(source, /今日训练/)
    assert.match(source, /今日饮食/)
  })
})
