import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { WorkoutForm } from "../components/workout-form"
import { emptyWorkout } from "../lib/workout-ui"
import type { WorkoutInput } from "../lib/wellness-types"

test("exercise inputs keep identity and focus through renaming, sorting and deletion", async () => {
  let saved: WorkoutInput | undefined
  const ui = render(createElement(WorkoutForm, { initial: emptyWorkout("2026-09-08", "12:00:00"), onSubmit: async value => { saved = value } }))
  try {
    fireEvent.click(ui.getByRole("button", { name: "添加动作" }))
    const first = ui.getByLabelText("动作 1 名称") as HTMLInputElement
    first.focus()
    for (const name of ["深", "深蹲", "深蹲训练"]) {
      fireEvent.change(first, { target: { value: name } })
      assert.equal(document.activeElement, first)
      assert.equal(ui.getByLabelText("动作 1 名称"), first)
    }
    fireEvent.click(ui.getByRole("button", { name: "添加动作" }))
    fireEvent.click(ui.getAllByRole("button", { name: "下移动作" })[0])
    assert.equal(ui.getByLabelText("动作 2 名称"), first)
    fireEvent.click(ui.getAllByRole("button", { name: "删除动作" })[0])
    assert.equal(ui.getByLabelText("动作 1 名称"), first)
    fireEvent.click(ui.getByRole("button", { name: "保存训练" }))
    await waitFor(() => assert.equal(saved?.exercises[0].name, "深蹲训练"))
    assert.equal("editId" in saved!.exercises[0], false)
  } finally { cleanup() }
})
