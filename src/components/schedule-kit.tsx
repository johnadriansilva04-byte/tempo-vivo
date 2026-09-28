import { CalendarDays, Circle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WEEKDAY_SHORT, formatDayLabel } from "@/lib/schedule";
import type { ScheduleOccurrence } from "@/types/profile";

/** Uma ocorrência concreta: 18:00 — Trabalho (categoria). */
export function OccurrenceRow({
  occurrence,
  active = false,
}: {
  occurrence: ScheduleOccurrence;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-3 border-b border-border py-2 last:border-b-0 ${
        active ? "text-foreground" : ""
      }`}
    >
      <span
        className={`w-24 shrink-0 font-display text-sm font-semibold tabular-nums ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {occurrence.start_time} — {occurrence.end_time}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">
        {occurrence.title}
      </span>
      <span
        className={`status ${active ? "status-open" : "status-neutral"} hidden sm:inline-flex`}
      >
        {occurrence.category}
      </span>
    </div>
  );
}

/** Dia inteiro (usado em HOJE/AMANHÃ): título + lista compacta ou vazio honesto. */
export function DayAgenda({
  title,
  dateIso,
  occurrences,
  emptyLabel = "Nenhum compromisso neste dia.",
  action,
}: {
  title: string;
  dateIso: string;
  occurrences: ScheduleOccurrence[];
  emptyLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="quiet-panel">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-faint">
            {title}
          </p>
          <p className="text-xs text-muted-foreground first-letter:capitalize">
            {formatDayLabel(dateIso)}
          </p>
        </div>
        {action}
      </div>
      <div className="mt-3">
        {occurrences.length === 0 ? (
          <p className="flex items-center gap-2 py-2 text-sm text-faint">
            <CalendarDays className="size-3.5" />
            {emptyLabel}
          </p>
        ) : (
          occurrences.map((o) => <OccurrenceRow key={o.id} occurrence={o} />)
        )}
      </div>
    </div>
  );
}

/** Seletor de dias da semana (dias da regra ou da disponibilidade). */
export function WeekdayPicker({
  value,
  onChange,
  mode = "multiple",
}: {
  value: number[];
  onChange: (next: number[]) => void;
  mode?: "multiple" | "single";
}) {
  const toggle = (wd: number) => {
    if (mode === "single") {
      onChange([wd]);
      return;
    }
    onChange(
      value.includes(wd)
        ? value.filter((d) => d !== wd)
        : [...value, wd].sort(),
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAY_SHORT.map((label, wd) => {
        const selected = value.includes(wd);
        return (
          <button
            key={wd}
            type="button"
            onClick={() => toggle(wd)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
            aria-pressed={selected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Lista de compromissos recorrentes — regra da rotina com ações rápidas. */
export function CommitmentList({
  commitments,
  onToggleActive,
  onDelete,
  onAddException,
  busyId,
}: {
  commitments: Array<{
    id: string;
    title: string;
    category: string;
    start_time: string;
    end_time: string;
    weekdays: number[];
    is_active: boolean;
  }>;
  onToggleActive: (c: {
    id: string;
    is_active: boolean;
    title: string;
    category: string;
    start_time: string;
    end_time: string;
    weekdays: number[];
    note: string;
  }) => void;
  onDelete: (id: string) => void;
  onAddException?: (commitmentId: string, commitmentTitle: string) => void;
  busyId?: string | undefined;
}) {
  if (commitments.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-sm text-faint">
        <Circle className="size-3.5" />
        Nenhum compromisso fixo ainda — a rotina nasce do que você registrar.
      </p>
    );
  }
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {commitments.map((c) => {
        const daysLabel =
          c.weekdays.length === 0 || c.weekdays.length === 7
            ? "Todos os dias"
            : c.weekdays
                .slice()
                .sort()
                .map((wd) => WEEKDAY_SHORT[wd % 7] ?? "")
                .join(", ");
        return (
          <div
            key={c.id}
            className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 ${
              c.is_active ? "" : "opacity-50"
            }`}
          >
            <span className="w-28 shrink-0 font-display text-sm font-semibold tabular-nums text-primary">
              {c.start_time} — {c.end_time}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {c.title}
            </span>
            <span className="text-xs text-muted-foreground">{daysLabel}</span>
            <span className="status status-neutral">{c.category}</span>
            <div className="flex items-center gap-1">
              {onAddException && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  title="Marcar exceção (folga/alteração pontual)"
                  disabled={busyId === c.id}
                  onClick={() => onAddException(c.id, c.title)}
                >
                  <Clock3 className="size-3" /> Exceção
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                disabled={busyId === c.id}
                onClick={() =>
                  onToggleActive({
                    id: c.id,
                    title: c.title,
                    category: c.category,
                    start_time: c.start_time,
                    end_time: c.end_time,
                    weekdays: c.weekdays,
                    note: "",
                    is_active: !c.is_active,
                  })
                }
              >
                {c.is_active ? "Pausar" : "Ativar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive"
                disabled={busyId === c.id}
                onClick={() => onDelete(c.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
