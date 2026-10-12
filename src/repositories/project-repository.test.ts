import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-errors";
import {
  addAttachment,
  addMissionDependency,
  clearLocalProjects,
  concludeMission,
  concludePhase,
  createMission,
  createPhase,
  createProject,
  deleteAttachment,
  deleteMission,
  deletePhase,
  getBundle,
  pauseMission,
  resumeMission,
  startMission,
  startPhase,
  substituteMission,
  updateMission,
  updatePhase,
} from "@/repositories/project-repository";

// ---------------------------------------------------------------------------
// Motor de projetos em modo local: replica as invariantes do banco (sequência,
// bloqueio, imutabilidade do concluído, substituição, versionamento, histórico).
// Os cenários espelham os testes obrigatórios da especificação.
// ---------------------------------------------------------------------------

beforeEach(() => {
  window.localStorage.clear();
  clearLocalProjects();
});

function phaseStatus(projectId: string, position: number): string {
  const b = getBundle(projectId);
  return b.phases.find((p) => p.position === position)?.status ?? "?";
}

describe("motor de projetos (modo local)", () => {
  it("Teste A — cria projeto, resumo e três fases; só a primeira disponível", () => {
    const id = createProject({
      name: "ANPP",
      objective: "Objetivo",
      initial_summary: "Resumo anterior",
    });
    createPhase({ project_id: id, title: "Organizar documentos" });
    createPhase({ project_id: id, title: "Estruturar argumentos" });
    createPhase({ project_id: id, title: "Preparar manifestação" });

    expect(phaseStatus(id, 1)).toBe("disponivel");
    expect(phaseStatus(id, 2)).toBe("bloqueada");
    expect(phaseStatus(id, 3)).toBe("bloqueada");

    const bundle = getBundle(id);
    expect(bundle.project.initial_summary).toBe("Resumo anterior");
    expect(
      bundle.events.some((e) => e.event_type === "resumo_registrado"),
    ).toBe(true);
  });

  it("não permite iniciar uma fase bloqueada", () => {
    const id = createProject({ name: "P" });
    createPhase({ project_id: id, title: "F1" });
    const f2 = createPhase({ project_id: id, title: "F2" });
    expect(() => startPhase(f2)).toThrow(ApiError);
  });

  it("Teste B — concluir a primeira congela o registro e desbloqueia a segunda", () => {
    const id = createProject({ name: "P" });
    const f1 = createPhase({ project_id: id, title: "F1" });
    createPhase({ project_id: id, title: "F2" });

    startPhase(f1);
    const recordId = concludePhase(f1, {
      executed: "feito",
      result: "resultado",
    });

    expect(phaseStatus(id, 1)).toBe("concluida");
    expect(phaseStatus(id, 2)).toBe("disponivel");

    const record = getBundle(id).phaseRecords.find((r) => r.id === recordId);
    expect(record?.final_snapshot["result_text"]).toBe("resultado");
    expect(
      getBundle(id).events.some((e) => e.event_type === "fase_desbloqueada"),
    ).toBe(true);
  });

  it("Teste C — fase concluída não pode ser editada, apagada nem reconcluída", () => {
    const id = createProject({ name: "P" });
    const f1 = createPhase({ project_id: id, title: "F1" });
    startPhase(f1);
    concludePhase(f1, { executed: "x" });

    expect(() => updatePhase(f1, { title: "reescrito" })).toThrow(ApiError);
    expect(() => deletePhase(f1)).toThrow(ApiError);
    expect(() => concludePhase(f1, { executed: "outra" })).toThrow(ApiError);
  });

  it("Teste D — missão adicional concluída tem registro final protegido", () => {
    const id = createProject({ name: "P" });
    const m = createMission({ project_id: id, title: "Investigar" });
    concludeMission(m, { summary: "ok", result: "achado" });

    expect(() => updateMission(m, { title: "x" })).toThrow(ApiError);
    expect(() => deleteMission(m)).toThrow(ApiError);
    const record = getBundle(id).missionRecords.find((r) => r.mission_id === m);
    expect(record?.final_snapshot["result"]).toBe("achado");
  });

  it("Teste E — substituição preserva as duas missões e o vínculo com motivo", () => {
    const id = createProject({ name: "P" });
    const a = createMission({ project_id: id, title: "3A Estratégia inicial" });
    const b = substituteMission(a, {
      title: "3B Estratégia alternativa",
      reason: "mudei de abordagem",
    });
    const c = substituteMission(b, { title: "3C Estratégia definitiva" });

    const bundle = getBundle(id);
    const ma = bundle.missions.find((m) => m.id === a)!;
    const mb = bundle.missions.find((m) => m.id === b)!;
    const mc = bundle.missions.find((m) => m.id === c)!;

    expect(ma.status).toBe("substituida");
    expect(mb.status).toBe("substituida");
    expect(mc.status).toBe("disponivel");
    expect(mb.replaces_mission_id).toBe(a);
    expect(mc.replaces_mission_id).toBe(b);
    expect(bundle.missions).toHaveLength(3);

    const subEvent = bundle.events.find(
      (e) => e.event_type === "missao_substituida" && e.mission_id === a,
    );
    expect(subEvent?.event_data["reason"]).toBe("mudei de abordagem");

    expect(() => concludeMission(a, {})).toThrow(ApiError);
  });

  it("Teste F — alterar missão em andamento cria nova versão sem sobrescrever a anterior", () => {
    const id = createProject({ name: "P" });
    const m = createMission({
      project_id: id,
      title: "Revisar",
      description: "v1",
    });
    updateMission(m, { description: "v2" }, "nova exigência");

    const versions = getBundle(id).versions.filter((v) => v.mission_id === m);
    expect(versions).toHaveLength(2);
    expect(versions[0]?.complete_snapshot["description"]).toBe("v1");
    expect(versions[1]?.complete_snapshot["description"]).toBe("v2");
    expect(versions[1]?.change_reason).toBe("nova exigência");
  });

  it("Teste J — adicionar fase depois de concluídas não reescreve o histórico", () => {
    const id = createProject({ name: "P" });
    const f1 = createPhase({ project_id: id, title: "F1" });
    startPhase(f1);
    concludePhase(f1, { result: "congelado" });
    const before = getBundle(id).phaseRecords.find(
      (r) => r.phase_id === f1,
    )?.final_snapshot;

    const f2 = createPhase({ project_id: id, title: "Acompanhar" });
    expect(getBundle(id).phases.find((p) => p.id === f2)?.position).toBe(2);

    expect(() =>
      createPhase({ project_id: id, title: "Intrusa", position: 1 }),
    ).toThrow(ApiError);

    const after = getBundle(id).phaseRecords.find(
      (r) => r.phase_id === f1,
    )?.final_snapshot;
    expect(after).toEqual(before);
  });

  it("missão vinculada a uma fase só libera quando a fase é concluída", () => {
    const id = createProject({ name: "P" });
    const f1 = createPhase({ project_id: id, title: "F1" });
    createPhase({ project_id: id, title: "F2" });
    const m = createMission({ project_id: id, title: "M-fase", phase_id: f1 });

    expect(getBundle(id).missions.find((x) => x.id === m)?.status).toBe(
      "bloqueada",
    );
    expect(() => concludeMission(m, {})).toThrow(ApiError);

    startPhase(f1);
    concludePhase(f1, { result: "ok" });

    expect(getBundle(id).missions.find((x) => x.id === m)?.status).toBe(
      "disponivel",
    );
    expect(() => concludeMission(m, { result: "feito" })).not.toThrow();
  });

  it("ciclo de vida da missão: iniciar, pausar e retomar com eventos", () => {
    const id = createProject({ name: "P" });
    const m = createMission({ project_id: id, title: "Investigar" });

    startMission(m);
    expect(getBundle(id).missions.find((x) => x.id === m)?.status).toBe(
      "em_andamento",
    );

    pauseMission(m);
    expect(getBundle(id).missions.find((x) => x.id === m)?.status).toBe(
      "pausada",
    );

    resumeMission(m);
    expect(getBundle(id).missions.find((x) => x.id === m)?.status).toBe(
      "disponivel",
    );

    const types = getBundle(id).events.map((e) => e.event_type);
    expect(types).toContain("missao_iniciada");
    expect(types).toContain("missao_pausada");
    expect(types).toContain("missao_retomada");
  });

  it("não permite iniciar uma missão bloqueada por dependência não concluída", () => {
    const id = createProject({ name: "P" });
    const a = createMission({ project_id: id, title: "A" });
    const b = createMission({ project_id: id, title: "B" });
    addMissionDependency(b, a); // B depende de A, que ainda não foi concluída

    expect(() => startMission(b)).toThrow(ApiError);

    concludeMission(a, { result: "ok" });
    expect(() => startMission(b)).not.toThrow();
  });

  it("anexos: bloqueados após conclusão, congelados no registro", () => {
    const id = createProject({ name: "P" });
    const f1 = createPhase({ project_id: id, title: "F1" });
    startPhase(f1);
    const att = addAttachment({
      project_id: id,
      file_name: "doc.pdf",
      phase_id: f1,
    });
    concludePhase(f1, { result: "ok" });

    expect(() =>
      addAttachment({ project_id: id, file_name: "novo.pdf", phase_id: f1 }),
    ).toThrow(ApiError);
    expect(() => deleteAttachment(att)).toThrow(ApiError);
    expect(getBundle(id).attachments.find((a) => a.id === att)?.kind).toBe(
      "final",
    );
  });

  it("persistência: o estado sobrevive a uma nova leitura", () => {
    const id = createProject({ name: "Persistente" });
    createPhase({ project_id: id, title: "F1" });
    // getBundle relê do localStorage a cada chamada — nada fica só em memória
    const reread = getBundle(id);
    expect(reread.project.name).toBe("Persistente");
    expect(reread.phases).toHaveLength(1);
  });
});
