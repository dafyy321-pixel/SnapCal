import "./dom-setup"
import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { render, cleanup } from "@testing-library/react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import ExportPage from "../app/profile/export/page"

test("export displays selected labels and explains its recovery scope", () => {
  try {
    const ui = render(createElement(AppRouterContext.Provider, { value: { back() {}, prefetch() {} } as never }, createElement(PathnameContext.Provider, { value: "/profile/export" }, createElement(ExportPage))))
    assert.deepEqual(ui.getAllByRole("combobox").map(node => node.textContent), ["全部数据", "JSON（数据导出）"])
    assert.match(ui.container.textContent!, /图片文件、自定义训练模板和食物助手会话不在导出范围内/)
    assert.match(ui.container.textContent!, /当前不支持 JSON 导入恢复/)
    assert.match(ui.container.textContent!, /停止应用后复制整个 data 目录/)
    assert.doesNotMatch(ui.container.textContent!, /JSON（完整备份）/)
  } finally { cleanup() }
})
