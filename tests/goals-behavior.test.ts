import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import GoalsPage from "../app/profile/goals/page"

test("saving loaded goals preserves each allergy, preference and equipment item", async () => {
  const originalFetch = globalThis.fetch
  const lists = { allergies: ["花生", "虾"], dietary_preferences: ["素食", "少乳糖"], available_equipment: ["哑铃", "弹力带"] }
  let submitted: typeof lists | undefined
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PUT") submitted = JSON.parse(String(init.body))
    return Response.json({ success: true, data: { profile: lists } })
  }
  try {
    const ui = render(createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } as never }, createElement(PathnameContext.Provider, { value: "/profile/goals" }, createElement(GoalsPage))))
    await waitFor(() => assert.equal((ui.getByLabelText("过敏食物") as HTMLInputElement).value, "花生、虾"))
    fireEvent.click(ui.getByRole("button", { name: "保存目标" }))
    await waitFor(() => assert.deepEqual(submitted?.allergies, lists.allergies))
    assert.deepEqual(submitted?.dietary_preferences, lists.dietary_preferences)
    assert.deepEqual(submitted?.available_equipment, lists.available_equipment)
    fireEvent.change(ui.getByLabelText("过敏食物"), { target: { value: "花生， 虾, 牛奶、鸡蛋" } })
    fireEvent.click(ui.getByRole("button", { name: "保存目标" }))
    await waitFor(() => assert.deepEqual(submitted?.allergies, ["花生", "虾", "牛奶", "鸡蛋"]))
  } finally { cleanup(); globalThis.fetch = originalFetch }
})
