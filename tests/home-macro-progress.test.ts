import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

test("home macro progress rings use the theme color directly", () => {
  const source = readFileSync("app/page.tsx", "utf8")

  assert.match(source, /conic-gradient\([^\n]+var\(--muted\) 0deg\)/)
  assert.doesNotMatch(source, /hsl\(var\(--muted\)\)/)
})
