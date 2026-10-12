import { ApiError } from "@/lib/api-errors";
import { newId } from "@/repositories/profile-repository";
import type {
  Mission,
  MissionComplement,
  MissionCompletionRecord,
  MissionDependency,
  MissionStatus,
  MissionVersion,
  PhaseCompletionRecord,
  PhaseStatus,
  Project,
  ProjectAttachment,
  ProjectBundle,
  ProjectEvent,
  ProjectPhase,
  ProjectSummary,
} from "@/types/projects";

// ---------------------------------------------------------------------------
// Motor de projetos em modo local (sem Supabase).
//
// Replica, em TypeScript, as mesmas invariantes garantidas pelas funções SQL e
// pelas triggers: sequência de fases, bloqueio, imutabilidade do que foi
// concluído, substituição de missões e histórico append-only. Assim o app roda
// igual com ou sem banco — e as regras não dependem só da interface.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "perfil-vivo:projects:v1";

type LocalProjectsDB = {
  version: 1;
  projects: Project[];
  phases: ProjectPhase[];
  missions: Mission[];
  dependencies: MissionDependency[];
  versions: MissionVersion[];
  phaseRecords: PhaseCompletionRecord[];
  missionRecords: MissionCompletionRecord[];
  complements: MissionComplement[];
  attachments: ProjectAttachment[];
  events: ProjectEvent[];
};

const LOCAL_USER_ID = "local-profile";

function seed(): LocalProjectsDB {
  return {
    version: 1,
    projects: [],
    phases: [],
    missions: [],
    dependencies: [],
    versions: [],
    phaseRecords: [],
    missionRecords: [],
    complements: [],
    attachments: [],
    events: [],
  };
}

function load(): LocalProjectsDB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<LocalProjectsDB>;
    const base = seed();
    return {
      ...base,
      ...(parsed as object),
      projects: parsed.projects ?? [],
      phases: parsed.phases ?? [],
      missions: parsed.missions ?? [],
      dependencies: parsed.dependencies ?? [],
      versions: parsed.versions ?? [],
      phaseRecords: parsed.phaseRecords ?? [],
      missionRecords: parsed.missionRecords ?? [],
      complements: parsed.complements ?? [],
      attachments: parsed.attachments ?? [],
      events: parsed.events ?? [],
    };
  } catch {
    return seed();
  }
}

function save(db: LocalProjectsDB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // quota excedida / storage indisponível
  }
}

export function clearLocalProjects(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// — helpers de domínio

function nowIso(): string {
  return new Date().toISOString();
}

function pushEvent(
  db: LocalProjectsDB,
  projectId: string,
  event_type: string,
  description: string,
  event_data: Record<string, unknown> = {},
  phaseId: string | null = null,
  missionId: string | null = null,
): void {
  db.events.push({
    id: newId("evt"),
    project_id: projectId,
    user_id: LOCAL_USER_ID,
    mission_id: missionId,
    phase_id: phaseId,
    event_type,
    description,
    event_data,
    created_at: nowIso(),
  });
}

function phasesOf(db: LocalProjectsDB, projectId: string): ProjectPhase[] {
  return db.phases
    .filter((p) => p.project_id === projectId)
    .sort((a, b) => a.position - b.position);
}

function isPhaseFrozen(db: LocalProjectsDB, phase: ProjectPhase): boolean {
  return (
    phase.status === "concluida" ||
    db.phaseRecords.some((r) => r.phase_id === phase.id)
  );
}

function isMissionFrozen(db: LocalProjectsDB, mission: Mission): boolean {
  return (
    mission.status === "concluida" ||
    mission.status === "substituida" ||
    db.missionRecords.some((r) => r.mission_id === mission.id)
  );
}

function findProject(db: LocalProjectsDB, id: string): Project {
  const p = db.projects.find((x) => x.id === id);
  if (!p) throw new ApiError("NOT_FOUND", "Projeto não encontrado.");
  return p;
}

function findPhase(db: LocalProjectsDB, id: string): ProjectPhase {
  const p = db.phases.find((x) => x.id === id);
  if (!p) throw new ApiError("NOT_FOUND", "Fase não encontrada.");
  return p;
}

function findMission(db: LocalProjectsDB, id: string): Mission {
  const m = db.missions.find((x) => x.id === id);
  if (!m) throw new ApiError("NOT_FOUND", "Missão não encontrada.");
  return m;
}

/** A primeira fase não concluída (em ordem) é a única elegível para executar. */
function recomputePhaseChain(db: LocalProjectsDB, projectId: string): void {
  const ordered = phasesOf(db, projectId);
  let firstOpenSeen = false;
  for (const phase of ordered) {
    if (phase.status === "concluida") continue;
    const prevDone = ordered
      .filter((p) => p.position < phase.position)
      .every((p) => p.status === "concluida");
    if (prevDone && !firstOpenSeen) {
      if (phase.status !== "em_andamento") phase.status = "disponivel";
      firstOpenSeen = true;
    } else if (phase.status !== "em_andamento") {
      phase.status = "bloqueada";
    }
  }
}

function unblockNextPhase(
  db: LocalProjectsDB,
  projectId: string,
  afterPos: number,
): ProjectPhase | null {
  const next = phasesOf(db, projectId).find((p) => p.position > afterPos);
  if (next && next.status === "bloqueada") {
    next.status = "disponivel";
    return next;
  }
  return null;
}

// ============================================================ leitura

export function listProjects(): ProjectSummary[] {
  const db = load();
  return db.projects
    .map((project) => summarize(db, project))
    .sort((a, b) => b.project.created_at.localeCompare(a.project.created_at));
}

function summarize(db: LocalProjectsDB, project: Project): ProjectSummary {
  const phases = phasesOf(db, project.id);
  const completed = phases.filter((p) => p.status === "concluida");
  const current =
    phases.find((p) => p.status === "em_andamento") ??
    phases.find((p) => p.status === "disponivel") ??
    null;
  const nextStep =
    current?.next_step?.trim() ||
    (current ? `Executar a fase ${current.position}: ${current.title}` : "") ||
    (phases.length > 0 && completed.length === phases.length
      ? "Todas as fases concluídas."
      : "");
  return {
    project,
    totalPhases: phases.length,
    completedPhases: completed.length,
    currentPhase: current,
    nextStep,
    activeMissionCount: db.missions.filter(
      (m) =>
        m.project_id === project.id &&
        ["disponivel", "em_andamento", "pausada"].includes(m.status),
    ).length,
  };
}

export function getBundle(projectId: string): ProjectBundle {
  const db = load();
  const project = findProject(db, projectId);
  return {
    project,
    phases: phasesOf(db, projectId),
    missions: db.missions
      .filter((m) => m.project_id === projectId)
      .sort(
        (a, b) =>
          a.position - b.position || a.created_at.localeCompare(b.created_at),
      ),
    dependencies: db.dependencies.filter((d) => d.project_id === projectId),
    versions: db.versions
      .filter((v) =>
        db.missions.some(
          (m) => m.id === v.mission_id && m.project_id === projectId,
        ),
      )
      .sort(
        (a, b) =>
          a.mission_id.localeCompare(b.mission_id) ||
          a.version_number - b.version_number,
      ),
    phaseRecords: db.phaseRecords.filter((r) => r.project_id === projectId),
    missionRecords: db.missionRecords.filter((r) => r.project_id === projectId),
    complements: db.complements.filter((c) => c.project_id === projectId),
    attachments: db.attachments.filter((a) => a.project_id === projectId),
    events: db.events
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

// ============================================================ projetos

export function createProject(input: {
  name: string;
  objective?: string;
  initial_summary?: string;
  context?: string;
}): string {
  const name = input.name.trim();
  if (!name) throw new ApiError("VALIDATION", "O projeto precisa de um nome.");
  const db = load();
  if (db.projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError("CONFLICT", "Já existe um projeto com este nome.");
  }
  const ts = nowIso();
  const project: Project = {
    id: newId("prj"),
    user_id: LOCAL_USER_ID,
    name,
    objective: input.objective?.trim() ?? "",
    initial_summary: input.initial_summary?.trim() ?? "",
    current_context: input.context?.trim() ?? "",
    created_at: ts,
    updated_at: null,
  };
  db.projects.push(project);
  pushEvent(db, project.id, "projeto_criado", "Projeto criado", { name });
  if (project.initial_summary) {
    pushEvent(
      db,
      project.id,
      "resumo_registrado",
      "Resumo inicial registrado",
      {
        initial_summary: project.initial_summary,
      },
    );
  }
  save(db);
  return project.id;
}

export function updateProjectContext(
  projectId: string,
  context: string,
  reason = "",
): void {
  const db = load();
  const project = findProject(db, projectId);
  // o resumo inicial nunca é reescrito: só o contexto atual evolui
  project.current_context = context;
  project.updated_at = nowIso();
  pushEvent(db, projectId, "contexto_atualizado", "Contexto atualizado", {
    context,
    reason,
  });
  save(db);
}

// ============================================================ fases

export function createPhase(input: {
  project_id: string;
  title: string;
  objective?: string;
  description?: string;
  instructions?: string;
  criteria?: string;
  position?: number | null;
}): string {
  const title = input.title.trim();
  if (!title) throw new ApiError("VALIDATION", "A fase precisa de um título.");
  const db = load();
  findProject(db, input.project_id);

  const ordered = phasesOf(db, input.project_id);
  const max = ordered.length ? ordered[ordered.length - 1]!.position : 0;
  const lastCompleted = ordered
    .filter((p) => p.status === "concluida")
    .reduce((acc, p) => Math.max(acc, p.position), 0);

  let position: number;
  if (input.position == null || input.position > max) {
    position = max + 1;
  } else {
    if (input.position <= lastCompleted) {
      throw new ApiError(
        "CONFLICT",
        "Não é possível inserir uma fase antes de fases já concluídas: isso reescreveria o histórico.",
      );
    }
    position = Math.max(input.position, 1);
    for (const p of ordered) if (p.position >= position) p.position += 1;
  }

  const pendingBefore = ordered.filter(
    (p) => p.position < position && p.status !== "concluida",
  ).length;
  const status: PhaseStatus = pendingBefore === 0 ? "disponivel" : "bloqueada";

  const ts = nowIso();
  const phase: ProjectPhase = {
    id: newId("phs"),
    project_id: input.project_id,
    user_id: LOCAL_USER_ID,
    position,
    title,
    objective: input.objective?.trim() ?? "",
    description: input.description?.trim() ?? "",
    instructions: input.instructions?.trim() ?? "",
    criteria: input.criteria?.trim() ?? "",
    subtasks: [],
    executed_text: "",
    result_text: "",
    observations: "",
    next_step: "",
    status,
    created_at: ts,
    updated_at: null,
  };
  db.phases.push(phase);
  pushEvent(
    db,
    input.project_id,
    "fase_adicionada",
    `Fase ${position} — ${title} adicionada`,
    {
      position,
      title,
      status,
    },
    phase.id,
  );
  save(db);
  return phase.id;
}

export function startPhase(phaseId: string): void {
  const db = load();
  const phase = findPhase(db, phaseId);
  if (phase.status === "concluida")
    throw new ApiError("LOCKED", "Fase já concluída.");
  if (phase.status === "bloqueada") {
    throw new ApiError(
      "LOCKED",
      "Fase bloqueada — conclua a fase anterior primeiro.",
    );
  }
  phase.status = "em_andamento";
  phase.updated_at = nowIso();
  pushEvent(
    db,
    phase.project_id,
    "fase_iniciada",
    `Fase ${phase.position} iniciada`,
    {
      position: phase.position,
    },
    phase.id,
  );
  save(db);
}

export function updatePhase(
  phaseId: string,
  patch: Partial<
    Pick<
      ProjectPhase,
      | "title"
      | "objective"
      | "description"
      | "instructions"
      | "criteria"
      | "subtasks"
      | "executed_text"
      | "result_text"
      | "observations"
      | "next_step"
    >
  >,
): void {
  const db = load();
  const phase = findPhase(db, phaseId);
  if (phase.status === "concluida") {
    throw new ApiError(
      "LOCKED",
      "Fase concluída é um registro protegido e não pode ser editada.",
    );
  }
  if (phase.status === "bloqueada") {
    throw new ApiError(
      "LOCKED",
      "Fase bloqueada — não é possível editar ainda.",
    );
  }
  Object.assign(phase, patch);
  if (patch.title !== undefined && patch.title.trim() === "") {
    throw new ApiError("VALIDATION", "A fase precisa de um título.");
  }
  phase.updated_at = nowIso();
  pushEvent(
    db,
    phase.project_id,
    "planejamento_alterado",
    `Planejamento da fase ${phase.position} atualizado`,
    {},
    phase.id,
  );
  save(db);
}

export function concludePhase(
  phaseId: string,
  final: {
    executed?: string;
    result?: string;
    observations?: string;
    next_step?: string;
  },
): string {
  const db = load();
  const phase = findPhase(db, phaseId);
  if (phase.status === "concluida")
    throw new ApiError("LOCKED", "Fase já concluída.");
  if (phase.status === "bloqueada") {
    throw new ApiError(
      "LOCKED",
      "Fase bloqueada — conclua a fase anterior primeiro.",
    );
  }
  const prev = phasesOf(db, phase.project_id)
    .filter((p) => p.position < phase.position)
    .pop();
  if (prev && prev.status !== "concluida") {
    throw new ApiError("LOCKED", "Conclua a fase anterior primeiro.");
  }

  if (final.executed) phase.executed_text = final.executed;
  if (final.result) phase.result_text = final.result;
  if (final.observations) phase.observations = final.observations;
  if (final.next_step) phase.next_step = final.next_step;

  const completedAt = nowIso();
  const snapshot = {
    phase_id: phase.id,
    project_id: phase.project_id,
    position: phase.position,
    title: phase.title,
    objective: phase.objective,
    description: phase.description,
    instructions: phase.instructions,
    criteria: phase.criteria,
    subtasks: phase.subtasks,
    executed_text: phase.executed_text,
    result_text: phase.result_text,
    observations: phase.observations,
    next_step: phase.next_step,
    completed_at: completedAt,
  };

  // anexos do planejamento passam a integrar o registro congelado
  for (const att of db.attachments) {
    if (att.phase_id === phase.id && att.kind === "planejada")
      att.kind = "final";
  }

  const record: PhaseCompletionRecord = {
    id: newId("pcr"),
    phase_id: phase.id,
    project_id: phase.project_id,
    user_id: LOCAL_USER_ID,
    final_snapshot: snapshot,
    completed_at: completedAt,
    completed_by: LOCAL_USER_ID,
  };
  db.phaseRecords.push(record);
  phase.status = "concluida";
  phase.updated_at = completedAt;

  pushEvent(
    db,
    phase.project_id,
    "fase_concluida",
    `Fase ${phase.position} — ${phase.title} concluída e arquivada`,
    { position: phase.position, record_id: record.id },
    phase.id,
  );

  const unlocked = unblockNextPhase(db, phase.project_id, phase.position);
  if (unlocked) {
    pushEvent(
      db,
      phase.project_id,
      "fase_desbloqueada",
      `Fase ${unlocked.position} — ${unlocked.title} desbloqueada`,
      { position: unlocked.position },
      unlocked.id,
    );
  }

  // missões vinculadas a esta fase deixam de estar bloqueadas por ela
  for (const m of db.missions) {
    if (m.phase_id === phase.id && m.status === "bloqueada") {
      m.status = "disponivel";
      m.updated_at = completedAt;
      pushEvent(
        db,
        phase.project_id,
        "missao_disponivel",
        `Missão "${m.title}" liberada com a conclusão da fase ${phase.position}`,
        { position: phase.position },
        phase.id,
        m.id,
      );
    }
  }

  save(db);
  return record.id;
}

export function deletePhase(phaseId: string): void {
  const db = load();
  const phase = findPhase(db, phaseId);
  if (
    phase.status === "concluida" ||
    db.phaseRecords.some((r) => r.phase_id === phaseId)
  ) {
    throw new ApiError("LOCKED", "Fase concluída não pode ser apagada.");
  }
  db.phases = db.phases.filter((p) => p.id !== phaseId);
  for (const m of db.missions) if (m.phase_id === phaseId) m.phase_id = null;
  recomputePhaseChain(db, phase.project_id);
  pushEvent(
    db,
    phase.project_id,
    "fase_removida",
    `Fase ${phase.position} removida`,
    {
      position: phase.position,
    },
  );
  save(db);
}

// ============================================================ missões

function nextMissionVersion(db: LocalProjectsDB, missionId: string): number {
  return (
    db.versions
      .filter((v) => v.mission_id === missionId)
      .reduce((acc, v) => Math.max(acc, v.version_number), 0) + 1
  );
}

function addVersion(
  db: LocalProjectsDB,
  mission: Mission,
  change_reason: string,
): number {
  const version_number = nextMissionVersion(db, mission.id);
  db.versions.push({
    id: newId("ver"),
    mission_id: mission.id,
    version_number,
    complete_snapshot: {
      title: mission.title,
      description: mission.description,
      context: mission.context,
      objective: mission.objective,
      status: mission.status,
      position: mission.position,
    },
    change_reason,
    created_at: nowIso(),
    created_by: LOCAL_USER_ID,
  });
  return version_number;
}

export function createMission(input: {
  project_id: string;
  title: string;
  description?: string;
  context?: string;
  objective?: string;
  phase_id?: string | null;
  replaces_mission_id?: string | null;
  reason?: string;
}): string {
  const title = input.title.trim();
  if (!title)
    throw new ApiError("VALIDATION", "A missão precisa de um título.");
  const db = load();
  findProject(db, input.project_id);

  let status: MissionStatus = "disponivel";
  if (input.phase_id) {
    const phase = findPhase(db, input.phase_id);
    if (phase.project_id !== input.project_id) {
      throw new ApiError(
        "VALIDATION",
        "A fase da missão não pertence a este projeto.",
      );
    }
    status = phase.status === "concluida" ? "disponivel" : "bloqueada";
  }

  const max = db.missions
    .filter((m) => m.project_id === input.project_id)
    .reduce((acc, m) => Math.max(acc, m.position), 0);

  const mission: Mission = {
    id: newId("msn"),
    project_id: input.project_id,
    phase_id: input.phase_id ?? null,
    user_id: LOCAL_USER_ID,
    title,
    description: input.description?.trim() ?? "",
    context: input.context?.trim() ?? "",
    objective: input.objective?.trim() ?? "",
    position: max + 1,
    status,
    replaces_mission_id: input.replaces_mission_id ?? null,
    created_at: nowIso(),
    updated_at: null,
  };
  db.missions.push(mission);
  addVersion(db, mission, "criação");
  pushEvent(
    db,
    input.project_id,
    "missao_criada",
    `Missão "${title}" criada`,
    {
      position: mission.position,
      status,
    },
    null,
    mission.id,
  );

  if (input.replaces_mission_id) {
    const original = findMission(db, input.replaces_mission_id);
    if (original.project_id !== input.project_id) {
      throw new ApiError(
        "VALIDATION",
        "A missão substituída pertence a outro projeto.",
      );
    }
    if (
      db.missions.some(
        (m) => m.replaces_mission_id === original.id && m.id !== mission.id,
      )
    ) {
      throw new ApiError("CONFLICT", "A missão já foi substituída.");
    }
    if (original.status !== "concluida") original.status = "substituida";
    pushEvent(
      db,
      input.project_id,
      "missao_substituida",
      `Missão "${original.title}" substituída por "${title}"`,
      {
        original_id: original.id,
        original_title: original.title,
        replacement_id: mission.id,
        reason: input.reason ?? "",
      },
      null,
      original.id,
    );
  }

  save(db);
  return mission.id;
}

export function updateMission(
  missionId: string,
  patch: {
    title?: string;
    description?: string;
    context?: string;
    objective?: string;
  },
  reason = "",
): void {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida") {
    throw new ApiError(
      "LOCKED",
      "Missão concluída é um registro protegido e não pode ser editada.",
    );
  }
  if (mission.status === "substituida") {
    throw new ApiError(
      "LOCKED",
      "Missão substituída permanece no histórico e não pode ser editada.",
    );
  }
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) throw new ApiError("VALIDATION", "A missão precisa de um título.");
    mission.title = t;
  }
  if (patch.description !== undefined) mission.description = patch.description;
  if (patch.context !== undefined) mission.context = patch.context;
  if (patch.objective !== undefined) mission.objective = patch.objective;
  mission.updated_at = nowIso();

  const version = addVersion(db, mission, reason);
  pushEvent(
    db,
    mission.project_id,
    "missao_alterada",
    `Missão "${mission.title}" alterada (versão ${version})`,
    { version, reason },
    null,
    mission.id,
  );
  pushEvent(
    db,
    mission.project_id,
    "nova_versao",
    `Nova versão da missão "${mission.title}" (v${version})`,
    { version },
    null,
    mission.id,
  );
  save(db);
}

export function substituteMission(
  missionId: string,
  input: {
    title: string;
    description?: string;
    context?: string;
    objective?: string;
    reason?: string;
  },
): string {
  const db = load();
  const original = findMission(db, missionId);
  return createMission({
    project_id: original.project_id,
    title: input.title,
    phase_id: original.phase_id,
    replaces_mission_id: missionId,
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.context !== undefined ? { context: input.context } : {}),
    ...(input.objective !== undefined ? { objective: input.objective } : {}),
    ...(input.reason !== undefined ? { reason: input.reason } : {}),
  });
}

export function concludeMission(
  missionId: string,
  final: {
    summary?: string;
    result?: string;
    observations?: string;
    next_step?: string;
  },
): string {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida")
    throw new ApiError("LOCKED", "Missão já concluída.");
  if (mission.status === "substituida") {
    throw new ApiError(
      "LOCKED",
      "Missão substituída não pode ser concluída — conclua a substituta.",
    );
  }
  if (mission.status === "bloqueada") {
    throw new ApiError(
      "LOCKED",
      "Missão bloqueada — conclua os requisitos primeiro.",
    );
  }
  const pendingDeps = db.dependencies.filter(
    (d) =>
      d.mission_id === missionId &&
      db.missions.find((m) => m.id === d.depends_on_mission_id)?.status !==
        "concluida",
  );
  if (pendingDeps.length > 0) {
    throw new ApiError(
      "LOCKED",
      "Há dependências não concluídas para esta missão.",
    );
  }

  const completedAt = nowIso();
  const snapshot = {
    mission_id: mission.id,
    project_id: mission.project_id,
    phase_id: mission.phase_id,
    position: mission.position,
    title: mission.title,
    description: mission.description,
    context: mission.context,
    objective: mission.objective,
    summary: final.summary ?? "",
    result: final.result ?? "",
    observations: final.observations ?? "",
    next_step: final.next_step ?? "",
    completed_at: completedAt,
  };

  for (const att of db.attachments) {
    if (att.mission_id === mission.id && att.kind === "planejada")
      att.kind = "final";
  }

  const record: MissionCompletionRecord = {
    id: newId("mcr"),
    mission_id: mission.id,
    project_id: mission.project_id,
    user_id: LOCAL_USER_ID,
    final_snapshot: snapshot,
    completed_at: completedAt,
    completed_by: LOCAL_USER_ID,
  };
  db.missionRecords.push(record);
  mission.status = "concluida";
  mission.updated_at = completedAt;

  pushEvent(
    db,
    mission.project_id,
    "missao_concluida",
    `Missão "${mission.title}" concluída e arquivada`,
    { record_id: record.id },
    null,
    mission.id,
  );
  save(db);
  return record.id;
}

export function startMission(missionId: string): void {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida" || mission.status === "substituida") {
    throw new ApiError("LOCKED", "Missão no histórico não pode ser iniciada.");
  }
  if (mission.status === "em_andamento") return;
  if (mission.phase_id) {
    const phase = findPhase(db, mission.phase_id);
    if (phase.status !== "concluida") {
      throw new ApiError(
        "LOCKED",
        "Missão bloqueada — conclua a fase de origem primeiro.",
      );
    }
  }
  const pendingDeps = db.dependencies.filter(
    (d) =>
      d.mission_id === missionId &&
      db.missions.find((m) => m.id === d.depends_on_mission_id)?.status !==
        "concluida",
  );
  if (pendingDeps.length > 0) {
    throw new ApiError(
      "LOCKED",
      "Há dependências não concluídas para esta missão.",
    );
  }
  mission.status = "em_andamento";
  mission.updated_at = nowIso();
  pushEvent(
    db,
    mission.project_id,
    "missao_iniciada",
    `Missão "${mission.title}" iniciada`,
    {},
    null,
    mission.id,
  );
  save(db);
}

export function pauseMission(missionId: string): void {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida" || mission.status === "substituida") {
    throw new ApiError("LOCKED", "Missão no histórico não pode ser pausada.");
  }
  if (mission.status === "pausada") return;
  mission.status = "pausada";
  mission.updated_at = nowIso();
  pushEvent(
    db,
    mission.project_id,
    "missao_pausada",
    `Missão "${mission.title}" pausada`,
    {},
    null,
    mission.id,
  );
  save(db);
}

export function resumeMission(missionId: string): void {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida" || mission.status === "substituida") {
    throw new ApiError("LOCKED", "Missão no histórico não pode ser retomada.");
  }
  if (mission.phase_id) {
    const phase = findPhase(db, mission.phase_id);
    if (phase.status !== "concluida") {
      throw new ApiError(
        "LOCKED",
        "Missão bloqueada — conclua a fase de origem primeiro.",
      );
    }
  }
  const pendingDeps = db.dependencies.filter(
    (d) =>
      d.mission_id === missionId &&
      db.missions.find((m) => m.id === d.depends_on_mission_id)?.status !==
        "concluida",
  );
  if (pendingDeps.length > 0) {
    throw new ApiError(
      "LOCKED",
      "Há dependências não concluídas para esta missão.",
    );
  }
  mission.status = "disponivel";
  mission.updated_at = nowIso();
  pushEvent(
    db,
    mission.project_id,
    "missao_retomada",
    `Missão "${mission.title}" retomada`,
    {},
    null,
    mission.id,
  );
  save(db);
}

export function deleteMission(missionId: string): void {
  const db = load();
  const mission = findMission(db, missionId);
  if (mission.status === "concluida" || mission.status === "substituida") {
    throw new ApiError("LOCKED", "Missão no histórico não pode ser apagada.");
  }
  if (db.missionRecords.some((r) => r.mission_id === missionId)) {
    throw new ApiError(
      "LOCKED",
      "Missão tem registro de conclusão e não pode ser apagada.",
    );
  }
  if (db.missions.some((m) => m.replaces_mission_id === missionId)) {
    throw new ApiError(
      "LOCKED",
      "Missão tem substituta vinculada e não pode ser apagada.",
    );
  }
  db.missions = db.missions.filter((m) => m.id !== missionId);
  db.dependencies = db.dependencies.filter(
    (d) => d.mission_id !== missionId && d.depends_on_mission_id !== missionId,
  );
  pushEvent(
    db,
    mission.project_id,
    "missao_removida",
    `Missão "${mission.title}" removida`,
    {},
  );
  save(db);
}

export function addMissionDependency(
  missionId: string,
  dependsOnMissionId: string,
): void {
  const db = load();
  const mission = findMission(db, missionId);
  const dep = findMission(db, dependsOnMissionId);
  if (mission.project_id !== dep.project_id) {
    throw new ApiError(
      "VALIDATION",
      "A dependência deve ser do mesmo projeto.",
    );
  }
  if (missionId === dependsOnMissionId) {
    throw new ApiError(
      "VALIDATION",
      "Uma missão não pode depender de si mesma.",
    );
  }
  // ciclo?
  const reachable = new Set<string>();
  const stack = [dependsOnMissionId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === missionId) {
      throw new ApiError("CONFLICT", "Dependência cíclica entre missões.");
    }
    if (reachable.has(cur)) continue;
    reachable.add(cur);
    for (const d of db.dependencies)
      if (d.mission_id === cur) stack.push(d.depends_on_mission_id);
  }
  if (
    db.dependencies.some(
      (d) =>
        d.mission_id === missionId &&
        d.depends_on_mission_id === dependsOnMissionId,
    )
  ) {
    return;
  }
  db.dependencies.push({
    id: newId("dep"),
    project_id: mission.project_id,
    mission_id: missionId,
    depends_on_mission_id: dependsOnMissionId,
    created_at: nowIso(),
  });
  pushEvent(
    db,
    mission.project_id,
    "dependencia_criada",
    `Missão "${mission.title}" passa a depender de "${dep.title}"`,
    { mission_id: missionId, depends_on: dependsOnMissionId },
    null,
    missionId,
  );
  save(db);
}

export function addMissionComplement(
  missionId: string,
  content: string,
  reason = "",
): string {
  const text = content.trim();
  if (!text)
    throw new ApiError("VALIDATION", "O complemento precisa de conteúdo.");
  const db = load();
  const mission = findMission(db, missionId);
  const complement: MissionComplement = {
    id: newId("cmp"),
    mission_id: missionId,
    project_id: mission.project_id,
    user_id: LOCAL_USER_ID,
    reason,
    content: text,
    created_at: nowIso(),
    created_by: LOCAL_USER_ID,
  };
  db.complements.push(complement);
  pushEvent(
    db,
    mission.project_id,
    "registro_complementar_criado",
    `Registro complementar para "${mission.title}"`,
    { complement_id: complement.id, reason },
    null,
    missionId,
  );
  save(db);
  return complement.id;
}

// ============================================================ anexos

export function addAttachment(input: {
  project_id: string;
  file_name: string;
  storage_path?: string;
  mime_type?: string;
  size_bytes?: number;
  phase_id?: string | null;
  mission_id?: string | null;
  label?: string;
  replaces?: string | null;
}): string {
  const fileName = input.file_name.trim();
  if (!fileName)
    throw new ApiError("VALIDATION", "O anexo precisa de um nome de arquivo.");
  const db = load();
  findProject(db, input.project_id);

  if (input.phase_id) {
    const phase = findPhase(db, input.phase_id);
    if (isPhaseFrozen(db, phase)) {
      throw new ApiError(
        "LOCKED",
        "Não é possível anexar a um registro já concluído.",
      );
    }
  }
  if (input.mission_id) {
    const mission = findMission(db, input.mission_id);
    if (isMissionFrozen(db, mission)) {
      throw new ApiError(
        "LOCKED",
        "Não é possível anexar a um registro já concluído.",
      );
    }
  }

  const attachment: ProjectAttachment = {
    id: newId("att"),
    project_id: input.project_id,
    phase_id: input.phase_id ?? null,
    mission_id: input.mission_id ?? null,
    user_id: LOCAL_USER_ID,
    file_name: fileName,
    storage_path: input.storage_path ?? "",
    mime_type: input.mime_type ?? "",
    size_bytes: input.size_bytes ?? 0,
    label: input.label ?? "",
    kind: "planejada",
    replaces_attachment_id: input.replaces ?? null,
    created_at: nowIso(),
  };
  db.attachments.push(attachment);
  pushEvent(
    db,
    input.project_id,
    input.replaces ? "documento_substituido" : "documento_anexado",
    input.replaces
      ? `Documento "${fileName}" substitui um anexo anterior`
      : `Documento "${fileName}" anexado`,
    { attachment_id: attachment.id, replaces: input.replaces ?? null },
    attachment.phase_id,
    attachment.mission_id,
  );
  save(db);
  return attachment.id;
}

function attachmentFrozen(
  db: LocalProjectsDB,
  att: ProjectAttachment,
): boolean {
  if (att.kind === "final") return true;
  if (att.phase_id && db.phaseRecords.some((r) => r.phase_id === att.phase_id))
    return true;
  if (
    att.mission_id &&
    db.missionRecords.some((r) => r.mission_id === att.mission_id)
  )
    return true;
  return false;
}

export function deleteAttachment(attachmentId: string): void {
  const db = load();
  const att = db.attachments.find((a) => a.id === attachmentId);
  if (!att) throw new ApiError("NOT_FOUND", "Anexo não encontrado.");
  if (attachmentFrozen(db, att)) {
    throw new ApiError(
      "LOCKED",
      "Anexo faz parte de um registro de conclusão e não pode ser removido.",
    );
  }
  db.attachments = db.attachments.filter((a) => a.id !== attachmentId);
  pushEvent(
    db,
    att.project_id,
    "documento_removido",
    `Documento "${att.file_name}" removido`,
    {
      attachment_id: attachmentId,
    },
    att.phase_id,
    att.mission_id,
  );
  save(db);
}
