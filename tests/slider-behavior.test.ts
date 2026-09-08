import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, cleanup } from "@testing-library/react"
import { Slider } from "../components/ui/slider"

test("each range thumb has its own accessible name", () => {
  try {
    const ui = render(createElement(Slider, { defaultValue: [20, 80], "aria-label": "范围", thumbLabels: ["最低值", "最高值"] }))
    assert.ok(ui.getByRole("slider", { name: "最低值" }))
    assert.ok(ui.getByRole("slider", { name: "最高值" }))
    ui.rerender(createElement(Slider, { defaultValue: [20, 80], "aria-label": "范围" }))
    assert.ok(ui.getByRole("slider", { name: "范围 1" }))
    assert.ok(ui.getByRole("slider", { name: "范围 2" }))
    ui.rerender(createElement("div", null, createElement("span", { id: "range-label" }, "训练目标"), createElement(Slider, { defaultValue: [3], "aria-labelledby": "range-label" })))
    assert.ok(ui.getByRole("slider", { name: "训练目标" }))
  } finally { cleanup() }
})
