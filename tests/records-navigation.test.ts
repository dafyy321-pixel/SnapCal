import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { NextRequest } from "next/server"

test("unified records and navigation", async t => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-records-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  const { closeDatabase } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const meals = await import("../app/api/meals/route")
  const records = await import("../app/api/records/route")
  const date = "2099-09-03"

  try {
    await meals.POST(new NextRequest("http://localhost/api/meals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ meal_name: "午餐", meal_type: "lunch", meal_date: date, meal_time: "12:00:00", calories: 500, protein: 25, carbs: 60, fats: 15 }) }))
    wellnessDb.createWorkout({ session_date: date, session_time: "18:00:00", title: "训练", workout_type: "strength", status: "completed", source: "manual", duration_minutes: 30, exercises: [] })
    wellnessDb.upsertCheckin(date, { energy: 3, hunger: 3, soreness: 2 })
    wellnessDb.upsertBodyMetric(date, { weight_kg: 70 })

    await t.test("returns all four record categories in one timeline", async () => {
      const response = await records.GET(new NextRequest(`http://localhost/api/records?start_date=${date}&end_date=${date}`))
      const body = await response.json() as { data: { items: Array<{ type: string }> } }
      assert.deepEqual(new Set(body.data.items.map(item => item.type)), new Set(["meal", "workout", "checkin", "body_metric"]))
    })

    await t.test("filters the timeline by record type", async () => {
      const response = await records.GET(new NextRequest(`http://localhost/api/records?start_date=${date}&end_date=${date}&type=workout`))
      const body = await response.json() as { data: { items: Array<{ type: string }> } }
      assert.deepEqual(body.data.items.map(item => item.type), ["workout"])
    })

    await t.test("exposes four navigation tabs and five quick actions", () => {
      const nav = readFileSync("components/bottom-nav.tsx", "utf8")
      const fab = readFileSync("components/fab-button.tsx", "utf8")
      for (const label of ["今天", "记录", "洞察", "我的"]) assert.match(nav, new RegExp(label))
      for (const label of ["扫描餐食", "手动添加餐食", "开始或补记训练", "今日状态打卡", "记录身体指标"]) assert.match(fab, new RegExp(label))
      assert.match(readFileSync("app/meals/new/page.tsx", "utf8"), /\/api\/meals/)
    })
  } finally {
    closeDatabase()
    rmSync(directory, { recursive: true, force: true })
  }
})
