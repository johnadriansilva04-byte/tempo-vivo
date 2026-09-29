import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Ordem das migrações.
//
// A migration 5 criava `one_off_events` (com FK para `meeting_requests`) antes
// de criar `meeting_requests`. Como o Supabase aplica cada migração numa única
// transação, o erro "relation public.meeting_requests does not exist" abortava
// TUDO: nenhuma tabela da agenda era criada e o app subia sem compromissos.
// Este teste trava a regra: nenhuma FK pode apontar para uma tabela que só
// aparece depois no mesmo arquivo.
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = resolve(__dirname, "migrations");

// Tabelas que já existem antes da migration 5 (criadas nas migrations iniciais).
const BASE_TABLES = new Set([
  "profiles",
  "daily_logs",
  "weekly_focus",
  "career_chapters",
  "projects",
  "milestones",
  "time_capsules",
]);

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/** Posição de cada `create table if not exists public.<nome>` no arquivo. */
function createdTablePositions(sql: string): Map<string, number> {
  const out = new Map<string, number>();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/gi;
  for (const m of sql.matchAll(re)) {
    const name = m[1]!.toLowerCase();
    if (!out.has(name)) out.set(name, m.index ?? 0);
  }
  return out;
}

describe("ordem das migrações", () => {
  it("não referencia tabela antes de criá-la (FK para frente)", () => {
    for (const file of migrationFiles()) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8");
      const created = createdTablePositions(sql);
      const re = /references\s+public\.(\w+)/gi;
      for (const m of sql.matchAll(re)) {
        const target = m[1]!.toLowerCase();
        if (BASE_TABLES.has(target)) continue;
        const at = created.get(target);
        expect(
          at,
          `${file}: FK para public.${target}, que não é criada nesse arquivo`,
        ).toBeDefined();
        expect(
          at! < (m.index ?? 0),
          `${file}: FK para public.${target} aparece antes do create table dessa tabela`,
        ).toBe(true);
      }
    }
  });

  it("a migration da agenda cria todas as tabelas que o app usa", () => {
    const sql = readFileSync(
      resolve(
        MIGRATIONS_DIR,
        "20260928000000_public_identity_schedule_family.sql",
      ),
      "utf8",
    );
    const created = createdTablePositions(sql);
    for (const table of [
      "recurring_commitments",
      "commitment_exceptions",
      "one_off_events",
      "availability_rules",
      "meeting_requests",
      "family_members",
    ]) {
      expect(created.has(table), `tabela ${table} não é criada`).toBe(true);
    }
  });
});
