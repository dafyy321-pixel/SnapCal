import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("scan modes and food assistant screen", async t => {
  const scan = readFileSync("app/scan/page.tsx", "utf8")
  const assistant = readFileSync("app/food-assist/[id]/page.tsx", "utf8")

  await t.test("keeps the existing contained image preview", () => {
    assert.match(scan, /object-contain object-center/)
    assert.match(scan, /unoptimized/)
  })

  await t.test("offers meal and inventory scan modes", () => {
    assert.match(scan, /记录一餐/)
    assert.match(scan, /看看怎么搭配/)
    assert.match(scan, /\/api\/food-assist/)
  })

  await t.test("requires item and nutrition confirmation before saving", () => {
    assert.match(assistant, /确认可用食材/)
    assert.match(assistant, /请先确认卡路里和三项宏量营养数据/)
    assert.match(assistant, /status: "saved"/)
  })
})
