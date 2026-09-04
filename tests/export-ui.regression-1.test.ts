import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Regression: ISSUE-001 — controlled export selects rendered blank until opened
// Found by /qa on 2026-09-04
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-04.md
test("export select triggers render their controlled labels before interaction", () => {
  const source = readFileSync(join(process.cwd(), "app/profile/export/page.tsx"), "utf8")
  assert.match(source, /<SelectValue>\{rangeLabels\[range\]\}<\/SelectValue>/)
  assert.match(source, /<SelectValue>\{formatLabels\[format\]\}<\/SelectValue>/)
  assert.match(source, /<SelectValue>\{categoryLabels\[category\]\}<\/SelectValue>/)
})
