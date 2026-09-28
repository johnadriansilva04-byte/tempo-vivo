import { useState } from "react";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/page-kit";
import { CommitmentList, WeekdayPicker } from "@/components/schedule-kit";
import {
  useCommitmentExceptions,
  useDeleteCommitment,
  useDeleteException,
  useDeleteOneOffEvent,
  useOneOffEvents,
  useRecurringCommitments,
  useUpsertCommitment,
  useUpsertException,
  useUpsertOneOffEvent,
} from "@/hooks/use-schedule";
import { todayIso, addDaysIso } from "@/lib/schedule";
import type { RecurringCommitment } from "@/types/profile";

type CommitmentDraft = {
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  weekdays: number[];
  note: string;
};

const emptyDraft: CommitmentDraft = {
  title: "",
  category: "Geral",
  start_time: "09:00",
  end_time: "18:00",
  weekdays: [1, 2, 3, 4, 5],
  note: "",
};

/**
 * Planner da agenda: compromissos fixos recorrentes, exceções pontuais
 * (a regra continua existindo) e compromissos eventuais.
 */
export function AgendaPlanner() {
  const { commitments } = useRecurringCommitments();
  const { exceptions } = useCommitmentExceptions();
  const { events } = useOneOffEvents();
  const upsert = useUpsertCommitment();
  const remove = useDeleteCommitment();
  const upsertException = useUpsertException();
  const removeException = useDeleteException();
  const upsertEvent = useUpsertOneOffEvent();
  const removeEvent = useDeleteOneOffEvent();

  const [draft, setDraft] = useState<CommitmentDraft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [exceptionFor, setExceptionFor] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [exceptionDraft, setExceptionDraft] = useState({
    exception_date: addDaysIso(todayIso(), 1),
    mode: "cancelled" as "cancelled" | "edited",
    title: "",
    start_time: "09:00",
    end_time: "18:00",
    note: "",
  });
  const [eventDraft, setEventDraft] = useState({
    event_date: todayIso(),
    start_time: "16:00",
    end_time: "17:00",
    title: "",
    note: "",
  });

  const submitCommitment = () => {
    if (!draft.title.trim()) return;
    if (draft.weekdays.length === 0) {
      toast.error(
        "Escolha pelo menos um dia da semana — ou deixe todos selecionados.",
      );
      return;
    }
    upsert.mutate(
      { ...draft, title: draft.title.trim(), is_active: true },
      {
        onSuccess: () => {
          toast.success(
            "Compromisso fixo salvo — a rotina é gerada automaticamente.",
          );
          setDraft(emptyDraft);
          setOpen(false);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
      },
    );
  };

  const submitException = () => {
    if (!exceptionFor) return;
    upsertException.mutate(
      {
        commitment_id: exceptionFor.id,
        exception_date: exceptionDraft.exception_date,
        mode: exceptionDraft.mode,
        title: exceptionDraft.mode === "edited" ? exceptionDraft.title : "",
        start_time:
          exceptionDraft.mode === "edited" ? exceptionDraft.start_time : "",
        end_time:
          exceptionDraft.mode === "edited" ? exceptionDraft.end_time : "",
        note: exceptionDraft.note,
      },
      {
        onSuccess: () => {
          toast.success(
            exceptionDraft.mode === "cancelled"
              ? "Exceção registrada — só aquela ocorrência vira folga; a regra continua."
              : "Ocorrência ajustada — só nesta data; a regra continua.",
          );
          setExceptionFor(null);
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha na exceção."),
      },
    );
  };

  const submitEvent = () => {
    if (!eventDraft.title.trim()) return;
    upsertEvent.mutate(
      { ...eventDraft, title: eventDraft.title.trim() },
      {
        onSuccess: () => {
          toast.success("Compromisso pontual adicionado à agenda.");
          setEventDraft({ ...eventDraft, title: "", note: "" });
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
      },
    );
  };

  const relevantExceptions = exceptions.filter(
    (x) => x.exception_date >= addDaysIso(todayIso(), -30),
  );

  return (
    <>
      <Section
        title="Compromissos fixos"
        detail="Rotina recorrente — o sistema gera as ocorrências de cada dia a partir da regra"
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? (
              "Fechar"
            ) : (
              <>
                <Plus className="size-3.5" /> Novo compromisso
              </>
            )}
          </Button>
        }
      >
        {open && (
          <div className="mb-4 rounded-lg border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Título
                </Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Ex.: Trabalho"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Categoria
                </Label>
                <Input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  placeholder="Trabalho, Estudo, Pesquisa…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Início
                </Label>
                <Input
                  type="time"
                  value={draft.start_time}
                  onChange={(e) =>
                    setDraft({ ...draft, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Fim
                </Label>
                <Input
                  type="time"
                  value={draft.end_time}
                  onChange={(e) =>
                    setDraft({ ...draft, end_time: e.target.value })
                  }
                />
                <p className="text-[11px] text-faint">
                  Fim menor que início = cruza a meia-noite (ex.: 18:00–00:00).
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Dias da semana
                </Label>
                <WeekdayPicker
                  value={draft.weekdays}
                  onChange={(weekdays) => setDraft({ ...draft, weekdays })}
                />
              </div>
            </div>
            <Button
              size="sm"
              className="mt-3"
              disabled={!draft.title.trim() || upsert.isPending}
              onClick={submitCommitment}
            >
              Salvar compromisso
            </Button>
          </div>
        )}
        <CommitmentList
          commitments={commitments}
          busyId={upsert.isPending || remove.isPending ? "…" : undefined}
          onToggleActive={(c) =>
            upsert.mutate(c, {
              onError: (e) =>
                toast.error(e instanceof Error ? e.message : "Falha."),
            })
          }
          onDelete={(id) => {
            if (
              !window.confirm("Excluir este compromisso fixo e suas exceções?")
            )
              return;
            remove.mutate(id, {
              onSuccess: () => toast.success("Compromisso fixo excluído."),
              onError: (e) =>
                toast.error(e instanceof Error ? e.message : "Falha."),
            });
          }}
          onAddException={(id, title) => setExceptionFor({ id, title })}
        />
      </Section>

      {exceptionFor && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                Exceção pontual
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sobre a regra “{exceptionFor.title}” — só esta data muda; a
                regra continua.
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExceptionFor(null)}
            >
              Cancelar
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Data
              </Label>
              <Input
                type="date"
                min={todayIso()}
                value={exceptionDraft.exception_date}
                onChange={(e) =>
                  setExceptionDraft({
                    ...exceptionDraft,
                    exception_date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                Tipo
              </Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={exceptionDraft.mode}
                onChange={(e) =>
                  setExceptionDraft({
                    ...exceptionDraft,
                    mode: e.target.value as "cancelled" | "edited",
                  })
                }
              >
                <option value="cancelled">Folga (cancelar)</option>
                <option value="edited">Ajustar horário/título</option>
              </select>
            </div>
            {exceptionDraft.mode === "edited" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Título
                  </Label>
                  <Input
                    value={exceptionDraft.title}
                    onChange={(e) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        title: e.target.value,
                      })
                    }
                    placeholder="Como será neste dia"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={exceptionDraft.start_time}
                    onChange={(e) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        start_time: e.target.value,
                      })
                    }
                    aria-label="Início"
                  />
                  <Input
                    type="time"
                    value={exceptionDraft.end_time}
                    onChange={(e) =>
                      setExceptionDraft({
                        ...exceptionDraft,
                        end_time: e.target.value,
                      })
                    }
                    aria-label="Fim"
                  />
                </div>
              </>
            )}
          </div>
          <Button
            size="sm"
            className="mt-3"
            disabled={upsertException.isPending}
            onClick={submitException}
          >
            Salvar exceção
          </Button>
        </div>
      )}

      <Section
        title="Exceções registradas"
        detail="Ocorrências alteradas pontualmente — a regra original permanece"
        className="mt-10"
      >
        {relevantExceptions.length === 0 ? (
          <p className="text-sm text-faint">
            Nenhuma exceção — a rotina segue 100% pela regra.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {relevantExceptions.map((ex) => {
              const rule = commitments.find((c) => c.id === ex.commitment_id);
              return (
                <div
                  key={ex.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                >
                  <span className="w-28 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {ex.exception_date}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {rule?.title ?? "Compromisso removido"}
                  </span>
                  <span
                    className={`status ${ex.mode === "cancelled" ? "status-review" : "status-open"}`}
                  >
                    {ex.mode === "cancelled" ? "Folga" : "Ajustado"}
                  </span>
                  {ex.mode === "edited" && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {ex.start_time} — {ex.end_time}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive"
                    onClick={() =>
                      removeException.mutate(ex.id, {
                        onSuccess: () =>
                          toast.success("Exceção removida — a regra já valia."),
                      })
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Compromissos eventuais"
        detail="Pontuais, sem recorrência — ex.: uma reunião no dia 25"
        className="mt-10"
      >
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:w-40">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Data
            </Label>
            <Input
              type="date"
              value={eventDraft.event_date}
              onChange={(e) =>
                setEventDraft({ ...eventDraft, event_date: e.target.value })
              }
            />
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-56">
            <Input
              type="time"
              value={eventDraft.start_time}
              onChange={(e) =>
                setEventDraft({ ...eventDraft, start_time: e.target.value })
              }
              aria-label="Início"
            />
            <Input
              type="time"
              value={eventDraft.end_time}
              onChange={(e) =>
                setEventDraft({ ...eventDraft, end_time: e.target.value })
              }
              aria-label="Fim"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Título
            </Label>
            <Input
              value={eventDraft.title}
              onChange={(e) =>
                setEventDraft({ ...eventDraft, title: e.target.value })
              }
              placeholder="Ex.: Reunião com cliente"
            />
          </div>
          <Button
            size="sm"
            disabled={!eventDraft.title.trim() || upsertEvent.isPending}
            onClick={submitEvent}
          >
            <CalendarPlus className="size-3.5" /> Adicionar
          </Button>
        </div>
        {events.filter((e) => e.event_date >= addDaysIso(todayIso(), -7))
          .length === 0 ? (
          <p className="text-sm text-faint">
            Nenhum compromisso pontual recente.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {events
              .filter((e) => e.event_date >= addDaysIso(todayIso(), -7))
              .sort((a, b) => a.event_date.localeCompare(b.event_date))
              .map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                >
                  <span className="w-28 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {ev.event_date}
                  </span>
                  <span className="w-28 shrink-0 text-sm tabular-nums text-primary">
                    {ev.start_time} — {ev.end_time}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {ev.title}
                  </span>
                  {ev.source === "meeting" && (
                    <span className="status status-open">Reunião</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive"
                    onClick={() =>
                      removeEvent.mutate(ev.id, {
                        onSuccess: () => toast.success("Evento removido."),
                      })
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Section>
    </>
  );
}
