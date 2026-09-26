import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getRouteApi } from "@tanstack/react-router";
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
import { DaySheet } from "@/components/agenda/day-sheet";
import { DayPanel } from "@/components/agenda/day-panel";
import { MonthGrid } from "@/components/agenda/month-grid";
import { MeetingRequestsPanel } from "@/components/agenda/meeting-requests-panel";
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
  nextEventAt,
  skipOccurrence,
  timeLabel,
  toIso,
  weekDays,
} from "@/lib/calendar";
import { cn, plural } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

type View = "mes" | "semana" | "hoje" | "pedidos";

const VIEWS: [View, string][] = [
  ["mes", "Mês"],
  ["semana", "Semana"],
  ["hoje", "Hoje"],
  ["pedidos", "Pedidos"],
];

const routeApi = getRouteApi("/agenda");

function shiftMonth(iso: string, delta: number): string {
  const d = fromIso(iso);
  d.setMonth(d.getMonth() + delta, 1);
  return toIso(d);
}

/**
 * Agenda = calendário compacto + painel do dia. O mês cabe na tela; clicar num
 * dia abre a gaveta com as atividades daquele dia — nada de coluna fixa.
 */
export function AgendaPage() {
  const { events, isLoading, error } = useAgendaEvents();
  const save = useSaveAgendaEvent();
  const remove = useDeleteAgendaEvent();

  const today = toIso(new Date());
  const { dia } = routeApi.useSearch();
  const [view, setView] = useState<View>("mes");
  const [anchor, setAnchor] = useState(dia ?? today);
  const [selected, setSelected] = useState(dia ?? today);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AgendaEvent | null>(null);

  // Chegada com `?dia=`: pula direto para aquele dia e abre o painel.
  useEffect(() => {
    if (!dia) return;
    setAnchor(dia);
    setSelected(dia);
    setSheetOpen(true);
  }, [dia]);

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
  const todayEvents = eventsByDay.get(today) ?? [];
  const next = useMemo(
    () => nextEventAt(events, today, new Date().toTimeString().slice(0, 5)),
    [events, today],
  );

  const conflicts = useMemo(
    () => new Set(conflictsFor(events, selected).map((e) => e.id)),
    [events, selected],
  );

  const occurrenceCount = useMemo(
    () => [...eventsByDay.values()].reduce((sum, list) => sum + list.length, 0),
    [eventsByDay],
  );

  const persist = (nextEvent: AgendaEvent) => {
    save.mutate(nextEvent, {
      onSuccess: () => {
        setSelected(nextEvent.event_date);
        setAnchor(nextEvent.event_date);
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
    setSheetOpen(true);
  };

  const openDay = (date: string) => {
    setSelected(date);
    setSheetOpen(true);
  };

  const monthLabel = `${MONTHS[fromIso(anchor).getMonth()]} ${fromIso(anchor).getFullYear()}`;
  const isCurrentMonth = anchor.slice(0, 7) === today.slice(0, 7);
  const weekDaysOfAnchor = weekDays(anchor);
  const weekLabel = weekRangeLabel(weekDaysOfAnchor);
  const isCurrentWeek = weekDaysOfAnchor.includes(today);

  /** Volta o foco para hoje, em qualquer visão. */
  const goToday = () => {
    setSelected(today);
    setAnchor(today);
    setSheetOpen(false);
  };

  const switchView = (id: View) => {
    setView(id);
    if (id === "hoje") {
      setSelected(today);
      setAnchor(today);
    } else if (id === "mes") {
      setAnchor(selected);
    }
  };

  const dayPanel = (
    <DayPanel
      iso={selected}
      events={selectedEvents}
      conflicts={conflicts}
      editing={draft !== null}
      draft={draft}
      pending={save.isPending || remove.isPending}
      showHeader
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

  const monthNav = (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Mês anterior"
        onClick={() => {
          const prev = shiftMonth(anchor, -1);
          setAnchor(prev);
        }}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="flex items-center gap-2">
        <p className="font-display text-sm font-semibold capitalize">{monthLabel}</p>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>
            Hoje
          </Button>
        )}
      </div>
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
          <div className="flex items-center gap-2">
            <div className="segmented" role="group" aria-label="Período da agenda">
              {VIEWS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn(view === id && "selected")}
                  aria-pressed={view === id}
                  onClick={() => switchView(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => startCreate(selected)}>
              <Plus className="size-3.5" /> Novo
            </Button>
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
        <div className="mx-auto max-w-3xl">
          {next && (
            <button
              type="button"
              onClick={() => openDay(next.event_date)}
              className="mb-3 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-faint">
                A seguir
              </span>
              <span className="font-display text-sm font-semibold text-accent-foreground">
                {timeLabel(next.start_time)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{next.title}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {next.event_date === today ? "hoje" : shortDay(next.event_date)}
              </span>
            </button>
          )}
          {monthNav}
          <MonthGrid
            iso={anchor}
            selected={selected}
            today={today}
            eventsByDay={eventsByDay}
            onSelect={openDay}
            onMove={setSelected}
          />
          {todayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => openDay(today)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span className="font-semibold text-foreground">Hoje</span>
              {todayEvents.length} {plural(todayEvents.length, "compromisso", "compromissos")}
              <span className="text-faint">· ver o dia</span>
            </button>
          )}
        </div>
      ) : view === "semana" ? (
        <div className="mx-auto max-w-3xl">
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
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold capitalize">{weekLabel}</p>
              {!isCurrentWeek && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={goToday}>
                  Hoje
                </Button>
              )}
            </div>
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
            {weekDaysOfAnchor.map((iso) => {
              const dayEvents = eventsByDay.get(iso) ?? [];
              const d = fromIso(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => openDay(iso)}
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
      ) : view === "pedidos" ? (
        <div className="mx-auto max-w-2xl">
          <MeetingRequestsPanel
            onAccepted={(date) => {
              setAnchor(date);
              setSelected(date);
            }}
          />
        </div>
      ) : (
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-5">
          {selectedEvents.length === 0 && !draft ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nenhum compromisso hoje"
              description="Adicione um evento para começar o dia."
              actionLabel="Adicionar evento"
              onAction={() => startCreate(today)}
            />
          ) : (
            dayPanel
          )}
        </div>
      )}

      <DaySheet
        open={sheetOpen}
        iso={selected}
        events={selectedEvents}
        conflicts={conflicts}
        editing={draft !== null}
        draft={draft}
        pending={save.isPending || remove.isPending}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setDraft(null);
        }}
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

/** "2026-09-26" → "sáb 26". Vazio se a data não estiver completa. */
function shortDay(iso: string): string {
  const d = fromIso(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }).replace(".", "");
}

/** "21 – 27 de setembro" — intervalo curto da semana visível. */
function weekRangeLabel(days: string[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return "";
  const a = fromIso(first);
  const b = fromIso(last);
  const month = MONTHS[b.getMonth()]?.toLowerCase() ?? "";
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} de ${month}`
    : `${a.getDate()} de ${MONTHS[a.getMonth()]?.toLowerCase()} – ${b.getDate()} de ${month}`;
}
