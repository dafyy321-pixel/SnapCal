import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Regression: ISSUE-004 — direct-entry back navigation left SnapCal for about:blank
// Found by /qa on 2026-09-04
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-04.md
test("mobile feature headers fall back to the home route without app history", () => {
  const source = readFileSync(join(process.cwd(), "components/mobile-page-header.tsx"), "utf8")
  assert.match(source, /window\.history\.length > 2 \? router\.back\(\) : router\.push\("\/"\)/)
  assert.match(source, /onClick=\{goBack\}/)
})
