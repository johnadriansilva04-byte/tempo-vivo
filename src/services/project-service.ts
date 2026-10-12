import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, mapUnknownError } from "@/lib/api-errors";
import { isLocalMode } from "@/lib/data-mode";
import { requireSupabase, withRetry } from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";
import * as local from "@/repositories/project-repository";
import type {
  Mission,
  MissionComplement,
  MissionCompletionRecord,
  MissionDependency,
  MissionVersion,
  PhaseCompletionRecord,
  Project,
  ProjectAttachment,
  ProjectBundle,
  ProjectEvent,
  ProjectPhase,
  ProjectSummary,
} from "@/types/projects";

// ---------------------------------------------------------------------------
// Serviço de projetos por fases sequenciais.
//
// Com Supabase configurado, TODA operação de escrita passa por funções SQL
// (`security definer`) que garantem, no banco, a sequência, a imutabilidade dos
// registros concluídos e a atomicidade de "concluir + congelar + desbloquear".
// Sem Supabase, o mesmo comportamento é replicado em `project-repository`.
//
// As tabelas novas não estão no `Database` gerado; usamos o client sem tipagem
// estrita para elas (mesmo padrão já usado no health check e nas RPCs de auth).
// ---------------------------------------------------------------------------

type Loose = SupabaseClient;

function db(): Loose {
  return requireSupabase() as unknown as Loose;
}

function toError(e: unknown): ApiError {
  const mapped = mapUnknownError(e);
  return mapped;
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = db();
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data as T;
}

function isRemote(): boolean {
  return !isLocalMode();
}

// ============================================================ leitura

export async function listProjects(): Promise<ProjectSummary[]> {
  if (!isRemote()) return local.listProjects();
  try {
    const client = db();
    const { data, error } = await withRetry(() =>
      client
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false }),
    );
    if (error) throw error;
    const projects = (data ?? []) as unknown as Project[];
    const summaries = await Promise.all(
      projects.map(async (project) => {
        const bundle = await getBundle(project.id);
        return summarizeBundle(bundle);
      }),
    );
    return summaries;
  } catch (e) {
    throw toError(e);
  }
}

function summarizeBundle(bundle: ProjectBundle): ProjectSummary {
  const phases = bundle.phases;
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
    project: bundle.project,
    totalPhases: phases.length,
    completedPhases: completed.length,
    currentPhase: current,
    nextStep,
    activeMissionCount: bundle.missions.filter((m) =>
      ["disponivel", "em_andamento", "pausada"].includes(m.status),
    ).length,
  };
}

export async function getBundle(projectId: string): Promise<ProjectBundle> {
  if (!isRemote()) return local.getBundle(projectId);
  try {
    const client = db();
    const [
      project,
      phases,
      missions,
      dependencies,
      versions,
      phaseRecords,
      missionRecords,
      complements,
      attachments,
      events,
    ] = await Promise.all([
      client.from("projects").select("*").eq("id", projectId).single(),
      client
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true }),
      client
        .from("missions")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true }),
      client
        .from("mission_dependencies")
        .select("*")
        .eq("project_id", projectId),
      client
        .from("mission_versions")
        .select("*")
        .order("version_number", { ascending: true }),
      client
        .from("phase_completion_records")
        .select("*")
        .eq("project_id", projectId),
      client
        .from("mission_completion_records")
        .select("*")
        .eq("project_id", projectId),
      client
        .from("mission_complements")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      client
        .from("phase_attachments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      client
        .from("project_events")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

    for (const res of [
      project,
      phases,
      missions,
      dependencies,
      versions,
      phaseRecords,
      missionRecords,
      complements,
      attachments,
      events,
    ]) {
      if (res.error) throw res.error;
    }

    const missionIds = new Set(
      ((missions.data ?? []) as unknown as Mission[]).map((m) => m.id),
    );
    return {
      project: project.data as unknown as Project,
      phases: (phases.data ?? []) as unknown as ProjectPhase[],
      missions: (missions.data ?? []) as unknown as Mission[],
      dependencies: (dependencies.data ?? []) as unknown as MissionDependency[],
      versions: ((versions.data ?? []) as unknown as MissionVersion[]).filter(
        (v) => missionIds.has(v.mission_id),
      ),
      phaseRecords: (phaseRecords.data ??
        []) as unknown as PhaseCompletionRecord[],
      missionRecords: (missionRecords.data ??
        []) as unknown as MissionCompletionRecord[],
      complements: (complements.data ?? []) as unknown as MissionComplement[],
      attachments: (attachments.data ?? []) as unknown as ProjectAttachment[],
      events: (events.data ?? []) as unknown as ProjectEvent[],
    };
  } catch (e) {
    throw toError(e);
  }
}

// ============================================================ projetos

export async function createProject(input: {
  name: string;
  objective?: string;
  initial_summary?: string;
  context?: string;
}): Promise<string> {
  const name = sanitizeText(input.name, 160);
  if (!name) throw new ApiError("VALIDATION", "O projeto precisa de um nome.");
  if (!isRemote()) return local.createProject({ ...input, name });
  try {
    return await rpc<string>("create_project", {
      p_name: name,
      p_objective: sanitizeText(input.objective ?? "", 2000),
      p_initial_summary: sanitizeText(input.initial_summary ?? "", 20000),
      p_context: sanitizeText(input.context ?? "", 20000),
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function updateProjectContext(
  projectId: string,
  context: string,
  reason = "",
): Promise<void> {
  if (!isRemote())
    return local.updateProjectContext(projectId, context, reason);
  try {
    await rpc("update_project_context", {
      p_project_id: projectId,
      p_context: sanitizeText(context, 20000),
      p_reason: sanitizeText(reason, 2000),
    });
  } catch (e) {
    throw toError(e);
  }
}

// ============================================================ fases

export async function createPhase(input: {
  project_id: string;
  title: string;
  objective?: string;
  description?: string;
  instructions?: string;
  criteria?: string;
  position?: number | null;
}): Promise<string> {
  const title = sanitizeText(input.title, 200);
  if (!title) throw new ApiError("VALIDATION", "A fase precisa de um título.");
  if (!isRemote()) return local.createPhase({ ...input, title });
  try {
    return await rpc<string>("create_phase", {
      p_project_id: input.project_id,
      p_title: title,
      p_objective: sanitizeText(input.objective ?? "", 4000),
      p_description: sanitizeText(input.description ?? "", 20000),
      p_instructions: sanitizeText(input.instructions ?? "", 20000),
      p_criteria: sanitizeText(input.criteria ?? "", 4000),
      p_position: input.position ?? null,
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function startPhase(phaseId: string): Promise<void> {
  if (!isRemote()) return local.startPhase(phaseId);
  try {
    await rpc("start_phase", { p_phase_id: phaseId });
  } catch (e) {
    throw toError(e);
  }
}

export async function updatePhase(
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
): Promise<void> {
  if (!isRemote()) return local.updatePhase(phaseId, patch);
  try {
    await rpc("update_phase", {
      p_phase_id: phaseId,
      p_title: patch.title ?? "",
      p_objective: patch.objective ?? "",
      p_description: patch.description ?? "",
      p_instructions: patch.instructions ?? "",
      p_criteria: patch.criteria ?? "",
      p_subtasks: patch.subtasks ?? [],
      p_executed: patch.executed_text ?? "",
      p_result: patch.result_text ?? "",
      p_observations: patch.observations ?? "",
      p_next_step: patch.next_step ?? "",
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function concludePhase(
  phaseId: string,
  final: {
    executed?: string;
    result?: string;
    observations?: string;
    next_step?: string;
  },
): Promise<string> {
  if (!isRemote()) return local.concludePhase(phaseId, final);
  try {
    return await rpc<string>("conclude_phase", {
      p_phase_id: phaseId,
      p_executed: sanitizeText(final.executed ?? "", 20000),
      p_result: sanitizeText(final.result ?? "", 20000),
      p_observations: sanitizeText(final.observations ?? "", 20000),
      p_next_step: sanitizeText(final.next_step ?? "", 4000),
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function deletePhase(phaseId: string): Promise<void> {
  if (!isRemote()) return local.deletePhase(phaseId);
  try {
    await rpc("delete_phase", { p_phase_id: phaseId });
  } catch (e) {
    throw toError(e);
  }
}

// ============================================================ missões

export async function createMission(input: {
  project_id: string;
  title: string;
  description?: string;
  context?: string;
  objective?: string;
  phase_id?: string | null;
}): Promise<string> {
  const title = sanitizeText(input.title, 200);
  if (!title)
    throw new ApiError("VALIDATION", "A missão precisa de um título.");
  if (!isRemote()) return local.createMission({ ...input, title });
  try {
    return await rpc<string>("create_mission", {
      p_project_id: input.project_id,
      p_title: title,
      p_description: sanitizeText(input.description ?? "", 20000),
      p_context: sanitizeText(input.context ?? "", 20000),
      p_objective: sanitizeText(input.objective ?? "", 4000),
      p_phase_id: input.phase_id ?? null,
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function updateMission(
  missionId: string,
  patch: {
    title?: string;
    description?: string;
    context?: string;
    objective?: string;
  },
  reason = "",
): Promise<void> {
  if (!isRemote()) return local.updateMission(missionId, patch, reason);
  try {
    await rpc("update_mission", {
      p_mission_id: missionId,
      p_title: patch.title ?? "",
      p_description: patch.description ?? "",
      p_context: patch.context ?? "",
      p_objective: patch.objective ?? "",
      p_reason: sanitizeText(reason, 2000),
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function substituteMission(
  missionId: string,
  input: {
    title: string;
    description?: string;
    context?: string;
    objective?: string;
    reason?: string;
  },
): Promise<string> {
  const title = sanitizeText(input.title, 200);
  if (!title)
    throw new ApiError("VALIDATION", "A nova missão precisa de um título.");
  if (!isRemote())
    return local.substituteMission(missionId, { ...input, title });
  try {
    return await rpc<string>("substitute_mission", {
      p_mission_id: missionId,
      p_title: title,
      p_description: sanitizeText(input.description ?? "", 20000),
      p_context: sanitizeText(input.context ?? "", 20000),
      p_objective: sanitizeText(input.objective ?? "", 4000),
      p_reason: sanitizeText(input.reason ?? "", 2000),
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function concludeMission(
  missionId: string,
  final: {
    summary?: string;
    result?: string;
    observations?: string;
    next_step?: string;
  },
): Promise<string> {
  if (!isRemote()) return local.concludeMission(missionId, final);
  try {
    return await rpc<string>("conclude_mission", {
      p_mission_id: missionId,
      p_summary: sanitizeText(final.summary ?? "", 20000),
      p_result: sanitizeText(final.result ?? "", 20000),
      p_observations: sanitizeText(final.observations ?? "", 20000),
      p_next_step: sanitizeText(final.next_step ?? "", 4000),
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function deleteMission(missionId: string): Promise<void> {
  if (!isRemote()) return local.deleteMission(missionId);
  try {
    await rpc("delete_mission", { p_mission_id: missionId });
  } catch (e) {
    throw toError(e);
  }
}

export async function startMission(missionId: string): Promise<void> {
  if (!isRemote()) return local.startMission(missionId);
  try {
    await rpc("start_mission", { p_mission_id: missionId });
  } catch (e) {
    throw toError(e);
  }
}

export async function pauseMission(missionId: string): Promise<void> {
  if (!isRemote()) return local.pauseMission(missionId);
  try {
    await rpc("pause_mission", { p_mission_id: missionId });
  } catch (e) {
    throw toError(e);
  }
}

export async function resumeMission(missionId: string): Promise<void> {
  if (!isRemote()) return local.resumeMission(missionId);
  try {
    await rpc("resume_mission", { p_mission_id: missionId });
  } catch (e) {
    throw toError(e);
  }
}

export async function addMissionDependency(
  missionId: string,
  dependsOnMissionId: string,
): Promise<void> {
  if (!isRemote())
    return local.addMissionDependency(missionId, dependsOnMissionId);
  try {
    await rpc("add_mission_dependency", {
      p_mission_id: missionId,
      p_depends_on_mission_id: dependsOnMissionId,
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function addMissionComplement(
  missionId: string,
  content: string,
  reason = "",
): Promise<string> {
  const text = sanitizeText(content, 20000);
  if (!text)
    throw new ApiError("VALIDATION", "O complemento precisa de conteúdo.");
  if (!isRemote()) return local.addMissionComplement(missionId, text, reason);
  try {
    return await rpc<string>("add_mission_complement", {
      p_mission_id: missionId,
      p_content: text,
      p_reason: sanitizeText(reason, 2000),
    });
  } catch (e) {
    throw toError(e);
  }
}

// ============================================================ anexos

export async function addAttachment(input: {
  project_id: string;
  file_name: string;
  storage_path?: string;
  mime_type?: string;
  size_bytes?: number;
  phase_id?: string | null;
  mission_id?: string | null;
  label?: string;
  replaces?: string | null;
}): Promise<string> {
  const fileName = sanitizeText(input.file_name, 260);
  if (!fileName)
    throw new ApiError("VALIDATION", "O anexo precisa de um nome de arquivo.");
  if (!isRemote())
    return local.addAttachment({ ...input, file_name: fileName });
  try {
    return await rpc<string>("add_phase_attachment", {
      p_project_id: input.project_id,
      p_file_name: fileName,
      p_storage_path: input.storage_path ?? "",
      p_mime_type: input.mime_type ?? "",
      p_size_bytes: input.size_bytes ?? 0,
      p_phase_id: input.phase_id ?? null,
      p_mission_id: input.mission_id ?? null,
      p_label: sanitizeText(input.label ?? "", 200),
      p_replaces: input.replaces ?? null,
    });
  } catch (e) {
    throw toError(e);
  }
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  if (!isRemote()) return local.deleteAttachment(attachmentId);
  try {
    await rpc("delete_phase_attachment", { p_attachment_id: attachmentId });
  } catch (e) {
    throw toError(e);
  }
}

export { clearLocalProjects } from "@/repositories/project-repository";
