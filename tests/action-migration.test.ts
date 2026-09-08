import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("upgrades an existing v3 database and allows one active action per date", async () => {
  const directory = mkdtempSync(join(tmpdir(), "snapcal-migration-"))
  process.env.SNAPCAL_DB_PATH = join(directory, "snapcal.db")
  delete process.env.OPENAI_API_KEY
  delete process.env.DOUBAO_API_KEY
  const { getDatabase, closeDatabase } = await import("../lib/local-db")
  const { generateActionCard } = await import("../lib/action-engine")
  const { wellnessDb } = await import("../lib/wellness-db")
  try {
    const db = getDatabase()
    for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all() as { name: string }[]) db.exec(`DROP TRIGGER ${name}`)
    db.exec("DROP INDEX idx_action_cards_one_active; CREATE UNIQUE INDEX idx_action_cards_one_active ON action_cards(status) WHERE status='active'; PRAGMA user_version=3;")
    closeDatabase()
    const upgraded = getDatabase()
    assert.equal(upgraded.prepare("PRAGMA user_version").get()!.user_version, 5)
    assert.equal(upgraded.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='trigger'").get()!.count, 12)
    const first = await generateActionCard("2020-01-01")
    const second = await generateActionCard("2020-01-02")
    assert.equal(wellnessDb.getActiveAction("2020-01-01")!.id, first.id)
    assert.equal(wellnessDb.getActiveAction("2020-01-02")!.id, second.id)
    const replacement = await generateActionCard("2020-01-02", { force: true })
    assert.notEqual(replacement.id, second.id)
    assert.equal(wellnessDb.listActions("2020-01-02", "2020-01-02").filter(card => card.status === "active").length, 1)
    closeDatabase()
    assert.equal(getDatabase().prepare("PRAGMA user_version").get()!.user_version, 5)
  } finally { closeDatabase(); rmSync(directory, { recursive: true, force: true }) }
})
