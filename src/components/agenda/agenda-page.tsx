import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, PageSkeleton } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { DayPanel } from "@/components/agenda/day-panel";
import { MonthGrid } from "@/components/agenda/month-grid";
import {
  draftFromEvent,
  emptyEventDraft,
  eventFromDraft,
  type EventDraft,
} from "@/components/agenda/draft";
import {
  useAgendaEvents,
  useDeleteAgendaEvent,
  useSaveAgendaEvent,
} from "@/hooks/use-agenda-events";
import {
  MONTHS,
  addDays,
  conflictsFor,
  eventsByDayInRange,
  fromIso,
  monthGrid,
  skipOccurrence,
  toIso,
  weekDays,
} from "@/lib/calendar";
import { cn, plural } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

type View = "mes" | "semana" | "hoje";

const VIEWS: [View, string][] = [
  ["mes", "Mês"],
  ["semana", "Semana"],
  ["hoje", "Hoje"],
];

function shiftMonth(iso: string, delta: number): string {
  const d = fromIso(iso);
  d.setMonth(d.getMonth() + delta, 1);
  return toIso(d);
}

/** Agenda = calendário real: ver os compromissos e agir sobre eles. */
export function AgendaPage() {
  const { events, isLoading, error } = useAgendaEvents();
  const save = useSaveAgendaEvent();
  const remove = useDeleteAgendaEvent();

  const today = toIso(new Date());
  const [view, setView] = useState<View>("mes");
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  // Compromisso aberto no diálogo de exclusão (repetido oferece duas opções).
  const [pendingDelete, setPendingDelete] = useState<AgendaEvent | null>(null);

  // Intervalo visível de cada visão — as repetições só são expandidas aqui.
  const range = useMemo<[string, string]>(() => {
    if (view === "mes") {
      const grid = monthGrid(anchor);
      return [grid[0]?.iso ?? anchor, grid[grid.length - 1]?.iso ?? anchor];
    }
    if (view === "semana") {
      const days = weekDays(anchor);
      return [days[0] ?? anchor, days[days.length - 1] ?? anchor];
    }
    return [selected, selected];
  }, [view, anchor, selected]);

  const eventsByDay = useMemo(
    () => eventsByDayInRange(events, range[0], range[1]),
    [events, range],
  );

  const selectedEvents = eventsByDay.get(selected) ?? [];

  // Compromissos que disputam horário no dia aberto — sinalizados na lista.
  const conflicts = useMemo(
    () => new Set(conflictsFor(events, selected).map((e) => e.id)),
    [events, selected],
  );

  // Conta ocorrências (repetidos aparecem em cada dia), não definições.
  const occurrenceCount = useMemo(
    () => [...eventsByDay.values()].reduce((sum, list) => sum + list.length, 0),
    [eventsByDay],
  );

  const persist = (next: AgendaEvent) => {
    save.mutate(next, {
      onSuccess: () => {
        setSelected(next.event_date);
        setAnchor(next.event_date);
        setDraft(null);
        toast.success("Compromisso salvo.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
    });
  };

  const removeEvent = (event: AgendaEvent) => {
    remove.mutate(event.id, {
      onSuccess: () => {
        setDraft(null);
        setPendingDelete(null);
        toast.success("Compromisso excluído.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível excluir."),
    });
  };

  /** Marca só `selected` fora de uma série — vira uma folga, sem apagar o resto. */
  const removeOccurrence = (event: AgendaEvent) => {
    save.mutate(skipOccurrence(event, selected), {
      onSuccess: () => toast.success("Dia removido da série."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível atualizar."),
    });
  };

  const duplicate = (event: AgendaEvent) => {
    const { id: _omit, ...rest } = draftFromEvent(event);
    setDraft({ ...emptyEventDraft(selected), ...rest, title: `${event.title} (cópia)` });
  };

  const startCreate = (date: string) => {
    setSelected(date);
    setDraft(emptyEventDraft(date));
  };

  const monthLabel = `${MONTHS[fromIso(anchor).getMonth()]} ${fromIso(anchor).getFullYear()}`;

  const dayPanel = (
    <DayPanel
      iso={selected}
      events={selectedEvents}
      conflicts={conflicts}
      editing={draft !== null}
      draft={draft}
      pending={save.isPending || remove.isPending}
      onDraftChange={setDraft}
      onStartEdit={(event) => setDraft(draftFromEvent(event))}
      onStartCreate={() => startCreate(selected)}
      onDuplicate={duplicate}
      onSave={() => draft && persist(eventFromDraft(draft))}
      onDelete={(id) => {
        const event = events.find((e) => e.id === id) ?? null;
        if (event) setPendingDelete(event);
      }}
      onRemoveOccurrence={removeOccurrence}
      onCancel={() => setDraft(null)}
    />
  );

  return (
    <>
      <PageHeader
        title="Agenda"
        detail={
          occurrenceCount > 0
            ? `${occurrenceCount} ${plural(occurrenceCount, "compromisso", "compromissos")}`
            : undefined
        }
        action={
          <div className="segmented" role="group" aria-label="Período da agenda">
            {VIEWS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cn(view === id && "selected")}
                aria-pressed={view === id}
                onClick={() => {
                  setView(id);
                  if (id === "mes") setAnchor(selected);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <PageSkeleton lines={2} rows={2} />
      ) : error ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Não consegui carregar a agenda"
          description={
            /relation|does not exist|404|schema cache/i.test(
              error instanceof Error ? error.message : "",
            )
              ? "A tabela de compromissos ainda não existe no banco. Rode a migration supabase/migrations/20260926000000_agenda_and_public_profile.sql no projeto Supabase e recarregue."
              : "Falha ao ler os compromissos. Verifique a conexão e tente de novo."
          }
        />
      ) : view === "mes" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Mês anterior"
                  onClick={() => setAnchor((a) => shiftMonth(a, -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Próximo mês"
                  onClick={() => setAnchor((a) => shiftMonth(a, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <p className="font-display text-sm font-semibold capitalize">{monthLabel}</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setAnchor(today);
                  setSelected(today);
                }}
              >
                Hoje
              </Button>
            </div>
            <MonthGrid
              iso={anchor}
              selected={selected}
              today={today}
              eventsByDay={eventsByDay}
              onSelect={(iso) => {
                setSelected(iso);
                if (!draft) return;
                setDraft({ ...draft, event_date: iso });
              }}
            />
          </div>
          <aside className="lg:border-l lg:border-border lg:pl-6">{dayPanel}</aside>
        </div>
      ) : view === "semana" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Semana anterior"
                onClick={() => setAnchor((a) => addDays(a, -7))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <p className="font-display text-sm font-semibold capitalize">{monthLabel}</p>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Próxima semana"
                onClick={() => setAnchor((a) => addDays(a, 7))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {weekDays(anchor).map((iso) => {
                const dayEvents = eventsByDay.get(iso) ?? [];
                const d = fromIso(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40",
                      iso === selected && "border-primary/60",
                      iso === today && "bg-primary/5",
                    )}
                  >
                    <div className="w-16 shrink-0">
                      <p className="font-display text-sm font-semibold capitalize">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.getDate()} {MONTHS[d.getMonth()]?.slice(0, 3).toLowerCase()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {dayEvents.length === 0 ? (
                        <p className="text-sm text-faint">Sem compromissos.</p>
                      ) : (
                        dayEvents.map((event) => (
                          <p key={event.id} className="truncate text-sm">
                            <span className="font-semibold text-accent-foreground">
                              {event.start_time.slice(0, 5)}
                            </span>{" "}
                            {event.title}
                          </p>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="lg:border-l lg:border-border lg:pl-6">{dayPanel}</aside>
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          {selectedEvents.length === 0 && !draft ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nenhum compromisso hoje"
              description="Adicione um evento para começar o dia."
              actionLabel="Adicionar evento"
              onAction={() => startCreate(today)}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-5">{dayPanel}</div>
          )}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (pendingDelete.recurrence?.days.length ?? 0) > 0
                ? "Este compromisso se repete. Você pode tirar só este dia ou excluir a série inteira."
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {pendingDelete && (pendingDelete.recurrence?.days.length ?? 0) > 0 && (
              <AlertDialogAction
                onClick={() => removeOccurrence(pendingDelete)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Só este dia
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={() => pendingDelete && removeEvent(pendingDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(pendingDelete?.recurrence?.days.length ?? 0) > 0 ? "Série inteira" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
