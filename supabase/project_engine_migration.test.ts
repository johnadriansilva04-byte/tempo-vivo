import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Trava as garantias do motor de projetos que vivem no banco. Sem um Postgres
// de verdade, validamos a estrutura da migration: as tabelas existem, as
// funções/triggers de imutabilidade estão declaradas e as RPCs de conclusão
// fazem a operação inteira (congelar + registrar + desbloquear) num só corpo.
// ---------------------------------------------------------------------------

const MIGRATION = resolve(
  __dirname,
  "migrations/20261011000000_project_execution_engine.sql",
);
const sql = readFileSync(MIGRATION, "utf8");

describe("migration do motor de projetos", () => {
  it("cria todas as tabelas do domínio", () => {
    for (const table of [
      "project_phases",
      "missions",
      "mission_dependencies",
      "mission_versions",
      "phase_completion_records",
      "mission_completion_records",
      "mission_complements",
      "phase_attachments",
      "project_events",
    ]) {
      expect(
        new RegExp(`create table if not exists public\\.${table}\\b`).test(sql),
        `tabela ${table} não é criada`,
      ).toBe(true);
    }
  });

  it("declara triggers de imutabilidade nos registros históricos", () => {
    for (const trigger of [
      "frozen_phase_completion",
      "frozen_mission_completion",
      "frozen_mission_versions",
      "frozen_mission_complements",
      "frozen_project_events",
      "guard_project_phases",
      "guard_missions",
      "guard_phase_attachments",
    ]) {
      expect(sql.includes(trigger), `trigger ${trigger} ausente`).toBe(true);
    }
  });

  it("protege as tabelas com Row Level Security", () => {
    for (const table of [
      "project_phases",
      "missions",
      "mission_versions",
      "phase_completion_records",
      "mission_completion_records",
      "project_events",
    ]) {
      expect(
        new RegExp(
          `alter table public\\.${table}\\s+enable row level security`,
        ).test(sql),
        `RLS ausente em ${table}`,
      ).toBe(true);
    }
    expect(sql).toContain("can_access_owner");
  });

  it("conclui fase, congela e desbloqueia na mesma função (atômico)", () => {
    const body = sql.slice(
      sql.indexOf("create or replace function public.conclude_phase"),
    );
    const end = body.indexOf("$$;");
    const fn = body.slice(0, end);
    expect(fn).toContain("insert into public.phase_completion_records");
    expect(fn).toContain("set status = 'concluida'");
    expect(fn).toContain("set status = 'disponivel'");
    expect(fn).toContain("fase_desbloqueada");
  });

  it("conclui missão congelando o registro e versiona a missão em andamento", () => {
    const conclude = sql.slice(
      sql.indexOf("create or replace function public.conclude_mission"),
    );
    expect(conclude.slice(0, conclude.indexOf("$$;"))).toContain(
      "insert into public.mission_completion_records",
    );
    expect(sql).toContain("create or replace function public.update_mission");
    expect(sql).toContain("insert into public.mission_versions");
  });

  it("registra a substituição de missão com vínculo e motivo", () => {
    expect(sql).toContain(
      "create or replace function public.substitute_mission",
    );
    expect(sql).toContain("replaces_mission_id");
    expect(sql).toContain("missao_substituida");
  });

  it("oferece o ciclo de vida da missão (iniciar, pausar, retomar)", () => {
    const lifecycle: Record<string, string> = {
      start_mission: "missao_iniciada",
      pause_mission: "missao_pausada",
      resume_mission: "missao_retomada",
    };
    for (const [fn, event] of Object.entries(lifecycle)) {
      expect(sql).toContain(`create or replace function public.${fn}`);
      expect(sql).toContain(event);
    }
  });

  it("libera as missões vinculadas quando a fase é concluída", () => {
    const body = sql.slice(
      sql.indexOf("create or replace function public.conclude_phase"),
    );
    const fn = body.slice(0, body.indexOf("$$;"));
    expect(fn).toContain("update public.missions set status = 'disponivel'");
    expect(fn).toContain("phase_id = p_phase_id");
  });

  it("permite inserir fase no meio sem violar a unicidade de posição", () => {
    expect(sql).toMatch(
      /unique \(project_id, position\) deferrable initially immediate/,
    );
    expect(sql).toContain(
      "set constraints public.project_phases_position_unique deferred",
    );
  });
});
