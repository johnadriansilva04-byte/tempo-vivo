/**
 * Tipos do domínio de execução de projetos — espelham as migrations SQL.
 *
 * Fonte: supabase/migrations/20261011000000_project_execution_engine.sql
 */

// ------------------------------------------------------------------ enums --

export type PhaseStatus =
  "bloqueada" | "disponivel" | "em_andamento" | "concluida" | "complementada";

export type MissionStatus =
  | "bloqueada"
  | "disponivel"
  | "em_andamento"
  | "concluida"
  | "substituida"
  | "pausada"
  | "cancelada";

export type AttachmentKind = "planejada" | "final";

// --------------------------------------------------------------- project --

export type Project = {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  /** Contexto anterior ao uso da aplicação. Registro histórico imutável. */
  initial_summary: string;
  /** Contexto atual — evolui por novas versões, sem reescrever o resumo. */
  current_context: string;
  created_at: string;
  updated_at: string | null;
};

export type ProjectPhase = {
  id: string;
  project_id: string;
  user_id: string;
  position: number;
  title: string;
  objective: string;
  description: string;
  instructions: string;
  criteria: string;
  subtasks: string[];
  executed_text: string;
  result_text: string;
  observations: string;
  next_step: string;
  status: PhaseStatus;
  created_at: string;
  updated_at: string | null;
};

export type Mission = {
  id: string;
  project_id: string;
  phase_id: string | null;
  user_id: string;
  title: string;
  description: string;
  context: string;
  objective: string;
  position: number;
  status: MissionStatus;
  /** Missão que esta substitui, quando for uma alternativa de estratégia. */
  replaces_mission_id: string | null;
  created_at: string;
  updated_at: string | null;
};

export type MissionDependency = {
  id: string;
  project_id: string;
  mission_id: string;
  depends_on_mission_id: string;
  created_at: string;
};

export type MissionVersion = {
  id: string;
  mission_id: string;
  version_number: number;
  complete_snapshot: Record<string, unknown>;
  change_reason: string;
  created_at: string;
  created_by: string | null;
};

export type PhaseCompletionRecord = {
  id: string;
  phase_id: string;
  project_id: string;
  user_id: string;
  final_snapshot: Record<string, unknown>;
  completed_at: string;
  completed_by: string | null;
};

export type MissionCompletionRecord = {
  id: string;
  mission_id: string;
  project_id: string;
  user_id: string;
  final_snapshot: Record<string, unknown>;
  completed_at: string;
  completed_by: string | null;
};

export type MissionComplement = {
  id: string;
  mission_id: string;
  project_id: string;
  user_id: string;
  reason: string;
  content: string;
  created_at: string;
  created_by: string | null;
};

export type ProjectAttachment = {
  id: string;
  project_id: string;
  phase_id: string | null;
  mission_id: string | null;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  label: string;
  kind: AttachmentKind;
  replaces_attachment_id: string | null;
  created_at: string;
};

export type ProjectEvent = {
  id: string;
  project_id: string;
  user_id: string;
  mission_id: string | null;
  phase_id: string | null;
  event_type: string;
  description: string;
  event_data: Record<string, unknown>;
  created_at: string;
};

// --------------------------------------------------------------- bundles --

/** Tudo o que a tela de um projeto precisa, numa leitura só. */
export type ProjectBundle = {
  project: Project;
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

/** Item de progresso exibido na lista inicial de projetos. */
export type ProjectSummary = {
  project: Project;
  totalPhases: number;
  completedPhases: number;
  currentPhase: ProjectPhase | null;
  nextStep: string;
  activeMissionCount: number;
};
