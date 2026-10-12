import { Check, ChevronRight, CircleDashed, Lock, Play } from "lucide-react";
import { formatDateTime, phaseStatusBadge } from "@/components/projects/status";
import type { PhaseCompletionRecord, ProjectPhase } from "@/types/projects";

/**
 * Linha do tempo das fases: nós conectados, na ordem do cronograma, com o
 * estado de cada fase visível de imediato. Fases bloqueadas mostram o motivo;
 * fases concluídas aparecem arquivadas, com a data em que foram congeladas.
 */
export function PhaseTimeline({
  phases,
  recordsByPhase,
  onOpen,
}: {
  phases: ProjectPhase[];
  recordsByPhase: Map<string, PhaseCompletionRecord>;
  onOpen: (phaseId: string) => void;
}) {
  return (
    <ol className="space-y-0">
      {phases.map((phase, i) => (
        <TimelineItem
          key={phase.id}
          phase={phase}
          previous={phases[i - 1] ?? null}
          isLast={i === phases.length - 1}
          completedAt={recordsByPhase.get(phase.id)?.completed_at ?? null}
          onOpen={() => onOpen(phase.id)}
        />
      ))}
    </ol>
  );
}

function TimelineItem({
  phase,
  previous,
  isLast,
  completedAt,
  onOpen,
}: {
  phase: ProjectPhase;
  previous: ProjectPhase | null;
  isLast: boolean;
  completedAt: string | null;
  onOpen: () => void;
}) {
  const badge = phaseStatusBadge(phase.status);
  const isCompleted = phase.status === "concluida";
  const isBlocked = phase.status === "bloqueada";
  const isCurrent =
    phase.status === "em_andamento" || phase.status === "disponivel";

  const node = isCompleted ? (
    <Check className="size-4" />
  ) : isBlocked ? (
    <Lock className="size-3.5" />
  ) : phase.status === "em_andamento" ? (
    <Play className="size-3.5" />
  ) : (
    <CircleDashed className="size-3.5" />
  );

  const reason =
    isBlocked && previous
      ? `Conclua a Fase ${previous.position} — ${previous.title} para desbloquear.`
      : null;

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className={[
            "z-10 grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold transition",
            isCompleted
              ? "border-primary/40 bg-primary/15 text-primary"
              : phase.status === "em_andamento"
                ? "border-[oklch(0.8_0.14_90)]/50 bg-[oklch(0.8_0.14_90)]/15 text-[oklch(0.85_0.12_90)]"
                : isCurrent
                  ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_30%,transparent)]"
                  : "border-border bg-muted text-faint",
          ].join(" ")}
        >
          {node}
        </span>
        {!isLast && (
          <span
            aria-hidden
            className={[
              "w-px flex-1",
              isCompleted ? "bg-primary/35" : "bg-border",
            ].join(" ")}
          />
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={[
          "expand-card mb-3 w-full text-left",
          isCompleted ? "opacity-90" : "",
        ].join(" ")}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Fase {phase.position}
            </span>
            <span className={badge.className}>{badge.label}</span>
          </span>
          <span className="mt-1 block font-display text-sm font-semibold text-foreground">
            {phase.title}
          </span>
          {reason && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {reason}
            </span>
          )}
          {isCompleted && completedAt && (
            <span className="mt-1 block text-[11px] text-faint">
              Arquivada em {formatDateTime(completedAt)}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-faint" />
      </button>
    </li>
  );
}

/** Legenda dos estados — deixa a sequência e os bloqueios previsíveis. */
export function PhaseLegend() {
  const items: { label: string; className: string }[] = [
    { label: "Concluída — arquivada", className: "status status-archive" },
    { label: "Disponível", className: "status status-open" },
    { label: "Em andamento", className: "status status-review" },
    { label: "Bloqueada", className: "status status-neutral" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => (
        <span key={it.label} className={it.className}>
          {it.label}
        </span>
      ))}
    </div>
  );
}
