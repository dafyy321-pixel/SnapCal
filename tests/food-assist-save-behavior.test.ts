import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { NextRequest } from "next/server"
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import FoodAssistPage from "../app/food-assist/[id]/page"

test("actual food assistant page saves a real draft and retries a lost link response without another meal", async () => {
  process.env.SNAPCAL_DB_PATH = ":memory:"
  const { localDb, closeDatabase } = await import("../lib/local-db")
  const { wellnessDb } = await import("../lib/wellness-db")
  const draftRoute = await import("../app/api/food-assist/[id]/meal-draft/route")
  const sessionRoute = await import("../app/api/food-assist/[id]/route")
  const mealsRoute = await import("../app/api/meals/route")
  const item = { id: crypto.randomUUID(), name: "香蕉", confidence: 90, portion_hint: null, nutrition_known: false }
  const session = wellnessDb.createFoodAssist({ context: "general", image_url: "/api/images/test.png", recognized_items: [item] })
  const suggestion = { title: "香蕉搭配", item_ids: [item.id], portion_hints: [], rationale: "按需选择", cautions: [] }
  wellnessDb.updateFoodAssist(session.id, { confirmed_items: [item], primary_suggestion: suggestion, alternative_suggestion: suggestion, status: "suggested" })
  const context = { params: Promise.resolve({ id: session.id }) }
  const originalFetch = globalThis.fetch
  let creates = 0
  let links = 0
  let destination = ""
  globalThis.fetch = async (url, init) => {
    const request = new NextRequest(`http://localhost${url}`, init)
    if (String(url).endsWith("/meal-draft")) return draftRoute.POST(request, context)
    if (url === "/api/meals") { creates++; return mealsRoute.POST(request) }
    if (init?.method === "PATCH") {
      const response = await sessionRoute.PATCH(request, context)
      if (++links === 1) throw new Error("连接中断，请重试关联")
      return response
    }
    return sessionRoute.GET(request, context)
  }
  try {
    const ui = render(createElement(AppRouterContext.Provider, { value: { back() {}, replace(path: string) { destination = path } } as never }, createElement(PathParamsContext.Provider, { value: { id: session.id } }, createElement(FoodAssistPage))))
    fireEvent.click(await ui.findByRole("button", { name: "记录已吃" }))
    await ui.findByRole("button", { name: "确认保存餐食" })
    for (const [name, value] of [["卡路里 kcal", "100"], ["蛋白质 g", "1"], ["碳水 g", "25"], ["脂肪 g", "0"]]) fireEvent.change(ui.getByLabelText(name), { target: { value } })
    fireEvent.click(ui.getByRole("button", { name: "确认保存餐食" }))
    await waitFor(() => assert.match(ui.getByRole("alert").textContent!, /连接中断/))
    assert.equal(creates, 1)
    assert.equal(localDb.listMeals().total, 1)
    fireEvent.click(ui.getByRole("button", { name: "确认保存餐食" }))
    await waitFor(() => assert.match(destination, /^\/meal\//))
    assert.equal(creates, 1)
    assert.equal(links, 2)
    assert.equal(wellnessDb.getFoodAssist(session.id)!.meal_id, localDb.listMeals().meals[0].id)
    assert.equal(ui.queryByRole("alert"), null)
  } finally { cleanup(); globalThis.fetch = originalFetch; closeDatabase() }
})
