import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { MONTHS, addDays, byStartTime, fromIso, toIso, weekDays } from "@/lib/calendar";
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
  const { events, isLoading } = useAgendaEvents();
  const save = useSaveAgendaEvent();
  const remove = useDeleteAgendaEvent();

  const today = toIso(new Date());
  const [view, setView] = useState<View>("mes");
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const event of events) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    for (const [day, list] of map) map.set(day, byStartTime(list));
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(selected) ?? [];

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

  const confirmDelete = (id: string) => {
    remove.mutate(id, {
      onSuccess: () => {
        setDraft(null);
        toast.success("Compromisso excluído.");
      },
    });
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
      editing={draft !== null}
      draft={draft}
      pending={save.isPending || remove.isPending}
      onDraftChange={setDraft}
      onStartEdit={(event) => setDraft(draftFromEvent(event))}
      onStartCreate={() => startCreate(selected)}
      onSave={() => draft && persist(eventFromDraft(draft))}
      onDelete={confirmDelete}
      onCancel={() => setDraft(null)}
    />
  );

  return (
    <>
      <PageHeader
        title="Agenda"
        detail={
          events.length > 0
            ? `${events.length} ${plural(events.length, "compromisso", "compromissos")}`
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
                  onClick={() => {
                    setView(id);
                    if (id === "mes") setAnchor(selected);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => startCreate(selected)}>
              <Plus className="size-3.5" /> Evento
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <PageSkeleton lines={2} rows={2} />
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
    </>
  );
}
