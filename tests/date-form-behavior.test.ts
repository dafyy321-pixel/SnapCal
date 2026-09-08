import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, fireEvent, waitFor, cleanup, act } from "@testing-library/react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import BodyMetricsPage from "../app/body-metrics/page"
import CheckInPage from "../app/check-in/page"

test("date forms discard stale loads, block failed loads and recover from write errors", async t => {
  const originalFetch = globalThis.fetch
  try {
    for (const [Page, endpoint, key, saveLabel, record] of [
      [BodyMetricsPage, "body-metrics", "metric", "保存指标", { weight_kg: 90, waist_cm: null, body_fat_percent: null, notes: "A" }],
      [CheckInPage, "checkins", "checkin", "保存状态", { energy: 3, hunger: 3, soreness: 3, sleep_hours: null, sleep_quality: null, notes: "A" }],
    ] as const) await t.test(endpoint, async () => {
      const pending = new Map<string, (response: Response) => void>()
      let failWrite = false
      const writes: string[] = []
      globalThis.fetch = async (input, init) => {
        const url = String(input)
        if (init?.method) {
          writes.push(url)
          if (failWrite) throw new Error("网络中断，请重试")
          return Response.json({ success: true, data: {} })
        }
        if (url === "/api/body-metrics") return Response.json({ success: true, data: { metrics: [] } })
        return new Promise(resolve => pending.set(url, resolve))
      }
      const ui = render(createElement(AppRouterContext.Provider, { value: { back() {} } as never }, createElement(SearchParamsContext.Provider, { value: new URLSearchParams() }, createElement(Page))))
      const date = ui.getByLabelText("日期") as HTMLInputElement
      const save = ui.getByRole("button", { name: saveLabel }) as HTMLButtonElement
      const respond = async (day: string, data: unknown = record, status = 200) => {
        await act(async () => { pending.get(`/api/${endpoint}/${day}`)!(Response.json({ success: status === 200, data: { [key]: data }, error: { message: "加载失败" } }, { status })) })
      }
      await respond(date.value)
      assert.equal(save.disabled, false)
      fireEvent.change(date, { target: { value: "2026-09-01" } })
      assert.equal(save.disabled, true)
      fireEvent.click(save)
      assert.equal(writes.length, 0)
      fireEvent.change(date, { target: { value: "2026-09-02" } })
      await respond("2026-09-02", { ...record, notes: "B" })
      await respond("2026-09-01")
      assert.equal((ui.getByLabelText("备注") as HTMLTextAreaElement).value, "B")
      fireEvent.click(save)
      await waitFor(() => assert.match(ui.getByRole("status").textContent!, /已保存/))
      assert.equal(writes[0], `/api/${endpoint}/2026-09-02`)
      failWrite = true
      fireEvent.click(save)
      await waitFor(() => assert.match(ui.getByRole("status").textContent!, /网络中断/))
      assert.equal((ui.getByLabelText("备注") as HTMLTextAreaElement).value, "B")
      fireEvent.click(ui.getByRole("button", { name: "删除" }))
      await waitFor(() => assert.match(ui.getByRole("status").textContent!, /网络中断/))
      failWrite = false
      fireEvent.click(save)
      await waitFor(() => assert.match(ui.getByRole("status").textContent!, /已保存/))
      fireEvent.change(date, { target: { value: "2026-09-03" } })
      await respond("2026-09-03", null, 500)
      assert.equal(save.disabled, true)
      fireEvent.click(ui.getByRole("button", { name: "重新加载" }))
      await respond("2026-09-03", null, 404)
      assert.equal(save.disabled, false)
      cleanup()
    })
  } finally { globalThis.fetch = originalFetch; cleanup() }
})
