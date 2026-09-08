import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, fireEvent, waitFor, cleanup, act } from "@testing-library/react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import HomePage from "../app/page"

const card = { id: "action-1", candidate_id: "logging", kind: "logging", title: "测试行动", action_text: "记录今日状态", rationale: "缺少记录", confidence: "low", source: "rules", valid_until: "2099-12-30T23:59:59Z", candidate_snapshot: [] }
const replacement = { ...card, id: "action-2", title: "新的行动" }
const ok = (data: unknown) => Response.json({ success: true, data })

test("home action feedback handles failed requests and recovery", async t => {
  t.afterEach(cleanup)
  const originalFetch = globalThis.fetch
  async function setup() {
    let active: typeof card | null = card
    const writes: Array<{ url: string; init: RequestInit }> = []
    let write: (url: string, init: RequestInit) => Promise<Response> = async () => ok({ action_card: card })
    globalThis.fetch = async (input, init) => {
      const url = String(input)
      if (init?.method) { writes.push({ url, init }); return write(url, init) }
      if (url.startsWith("/api/day?")) return ok({ meals: [], workouts: [], checkin: null, body_metric: null, action_card: active, summary: { workout_minutes: 0, completed_workout_count: 0 } })
      if (url === "/api/profile") return ok({ profile: { daily_calorie_goal: 1800, daily_protein_goal: 50, daily_carbs_goal: 250, daily_fats_goal: 65 } })
      throw new Error(`Unexpected request: ${url}`)
    }
    const ui = render(createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } as never }, createElement(PathnameContext.Provider, { value: "/" }, createElement(HomePage))))
    await ui.findByText(card.title)
    await waitFor(() => assert.equal(ui.queryByText("加载中…"), null))
    return { ui, writes, setActive(value: typeof card | null) { active = value }, setWrite(handler: typeof write) { write = handler } }
  }
  try {
    await t.test("keeps the card when PATCH returns an HTTP or envelope error", async () => {
      for (const status of [503, 200]) {
        const { ui, writes, setWrite } = await setup()
        setWrite(async () => Response.json({ success: false, error: { message: "状态更新失败" } }, { status }))
        fireEvent.click(ui.getByRole("button", { name: "换一个" }))
        await ui.findByText("状态更新失败")
        assert.ok(ui.getByText(card.title))
        assert.equal(writes.length, 1)
        assert.equal((ui.getByRole("button", { name: "完成" }) as HTMLButtonElement).disabled, false)
        cleanup()
      }
    })
    await t.test("catches a lost PATCH response and reloads server state without repeating the write", async () => {
      const { ui, writes, setActive, setWrite } = await setup()
      setWrite(async () => { setActive(replacement); throw new TypeError("Failed to fetch") })
      fireEvent.click(ui.getByRole("button", { name: "完成" }))
      await ui.findByText(/连接本地服务失败/)
      assert.ok(ui.getByText(card.title))
      fireEvent.click(ui.getByRole("button", { name: "重试" }))
      await ui.findByText(replacement.title)
      assert.equal(writes.length, 1)
      assert.equal(ui.queryByText(/连接本地服务失败/), null)
      cleanup()
    })
    await t.test("recovers a failed replacement generation without repeating PATCH", async () => {
      const { ui, writes, setActive, setWrite } = await setup()
      setWrite(async (_url, init) => {
        if (init.method === "PATCH") { setActive(null); return ok({ action_card: card }) }
        throw new TypeError("Failed to fetch")
      })
      fireEvent.click(ui.getByRole("button", { name: "换一个" }))
      await ui.findByText(/连接本地服务失败/)
      assert.equal(ui.queryByText(card.title), null)
      setWrite(async () => { setActive(replacement); return ok({ action_card: replacement }) })
      fireEvent.click(ui.getByRole("button", { name: "重试" }))
      await ui.findByText(replacement.title)
      assert.equal(writes.filter(item => item.init.method === "PATCH").length, 1)
      assert.equal(JSON.parse(writes.at(-1)!.init.body as string).force, undefined)
      cleanup()
    })
    await t.test("locks action controls and date during a pending write, then shows the replacement", async () => {
      const { ui, writes, setWrite } = await setup()
      let resolvePatch!: (response: Response) => void
      setWrite(async (_url, init) => init.method === "PATCH" ? new Promise(resolve => { resolvePatch = resolve }) : ok({ action_card: replacement }))
      const replace = ui.getByRole("button", { name: "换一个" })
      fireEvent.click(replace)
      for (const name of ["去完成", "完成", "不适合", "稍后", "换一个"]) assert.equal((ui.getByRole("button", { name }) as HTMLButtonElement).disabled, true)
      assert.equal((ui.getByLabelText("选择日期") as HTMLInputElement).disabled, true)
      fireEvent.click(replace)
      assert.equal(writes.length, 1)
      await act(async () => resolvePatch(ok({ action_card: card })))
      await ui.findByText(replacement.title)
      assert.equal(writes.length, 2)
      assert.equal((ui.getByLabelText("选择日期") as HTMLInputElement).disabled, false)
      cleanup()
    })
  } finally { cleanup(); globalThis.fetch = originalFetch }
})
