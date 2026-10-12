import type { MissionStatus, PhaseStatus } from "@/types/projects";

type Badge = { label: string; className: string };

export function phaseStatusBadge(status: PhaseStatus): Badge {
  switch (status) {
    case "concluida":
      return {
        label: "Concluída — registro protegido",
        className: "status status-archive",
      };
    case "complementada":
      return {
        label: "Concluída · com complemento",
        className: "status status-archive",
      };
    case "em_andamento":
      return { label: "Em andamento", className: "status status-review" };
    case "disponivel":
      return {
        label: "Disponível para execução",
        className: "status status-open",
      };
    case "bloqueada":
    default:
      return { label: "Bloqueada", className: "status status-neutral" };
  }
}

export function missionStatusBadge(status: MissionStatus): Badge {
  switch (status) {
    case "concluida":
      return {
        label: "Concluída — registro protegido",
        className: "status status-archive",
      };
    case "em_andamento":
      return { label: "Em andamento", className: "status status-review" };
    case "disponivel":
      return { label: "Disponível", className: "status status-open" };
    case "substituida":
      return { label: "Substituída", className: "status status-neutral" };
    case "pausada":
      return { label: "Pausada", className: "status status-neutral" };
    case "cancelada":
      return { label: "Cancelada", className: "status status-neutral" };
    case "bloqueada":
    default:
      return { label: "Bloqueada", className: "status status-neutral" };
  }
}

const EVENT_LABELS: Record<string, string> = {
  projeto_criado: "Projeto criado",
  resumo_registrado: "Resumo inicial registrado",
  contexto_atualizado: "Contexto atualizado",
  fase_adicionada: "Fase adicionada",
  fase_iniciada: "Fase iniciada",
  planejamento_alterado: "Planejamento alterado",
  fase_concluida: "Fase concluída",
  fase_desbloqueada: "Próxima fase desbloqueada",
  fase_removida: "Fase removida",
  missao_criada: "Missão criada",
  missao_alterada: "Missão alterada",
  nova_versao: "Nova versão criada",
  missao_substituida: "Missão substituída",
  missao_concluida: "Missão concluída",
  missao_iniciada: "Missão iniciada",
  missao_pausada: "Missão pausada",
  missao_retomada: "Missão retomada",
  missao_disponivel: "Missão liberada",
  missao_removida: "Missão removida",
  dependencia_criada: "Dependência criada",
  registro_complementar_criado: "Registro complementar criado",
  documento_anexado: "Documento anexado",
  documento_substituido: "Documento substituído",
  documento_removido: "Documento removido",
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
