import { AlertTriangle, CalendarX, Clock3, Copy, MapPin, Pencil, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/agenda/event-form";
import type { EventDraft } from "@/components/agenda/draft";
import { byStartTime, dayLabel, isRecurring, recurrenceLabel, timeLabel } from "@/lib/calendar";
import { isPlaceholderText } from "@/lib/placeholder";
import { cn } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

/** Lista + edição dos compromissos de um dia. Burro: só mostra e delega. */
export function DayPanel({
  iso,
  events,
  conflicts,
  editing,
  draft,
  pending,
  showHeader = true,
  onDraftChange,
  onStartEdit,
  onStartCreate,
  onDuplicate,
  onSave,
  onDelete,
  onRemoveOccurrence,
  onCancel,
}: {
  iso: string;
  events: AgendaEvent[];
  /** Ids de compromissos que disputam o mesmo horário neste dia. */
  conflicts: Set<string>;
  editing: boolean;
  draft: EventDraft | null;
  pending: boolean;
  /** No painel lateral o título do dia já vive no cabeçalho da gaveta. */
  showHeader?: boolean;
  onDraftChange: (draft: EventDraft) => void;
  onStartEdit: (event: AgendaEvent) => void;
  onStartCreate: () => void;
  onDuplicate: (event: AgendaEvent) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onRemoveOccurrence: (event: AgendaEvent) => void;
  onCancel: () => void;
}) {
  const ordered = byStartTime(events);

  return (
    <div className="space-y-4">
      {showHeader && (
        <h2 className="font-display text-base font-semibold capitalize text-foreground">
          {dayLabel(iso)}
        </h2>
      )}

      {editing && draft && (
        <div className="rounded-lg border border-border bg-card p-4">
          <EventForm
            draft={draft}
            onChange={onDraftChange}
            onSave={onSave}
            onCancel={onCancel}
            pending={pending}
            {...(draft.id ? { onDelete: () => onDelete(draft.id!) } : {})}
          />
        </div>
      )}

      {ordered.length === 0 && !editing ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum compromisso neste dia.
        </p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((event) => (
            <li
              key={event.id}
              className={cn("event-row group", conflicts.has(event.id) && "event-row-conflict")}
            >
              <span className="event-time">{timeLabel(event.start_time)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  {isRecurring(event) && (
                    <Repeat
                      className="size-3 shrink-0 text-muted-foreground"
                      aria-label="Repetido"
                    />
                  )}
                  {isPlaceholderText(event.title) ? "" : event.title}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {event.end_time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" />
                      até {timeLabel(event.end_time)}
                    </span>
                  )}
                  {event.location && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="size-3" />
                      {event.location}
                    </span>
                  )}
                  {isRecurring(event) && (
                    <span className="text-faint">{recurrenceLabel(event.recurrence)}</span>
                  )}
                  {conflicts.has(event.id) && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertTriangle className="size-3" />
                      Conflito de horário
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Duplicar ${event.title}`}
                  onClick={() => onDuplicate(event)}
                >
                  <Copy className="size-3.5" />
                </Button>
                {isRecurring(event) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Remover ${event.title} só deste dia`}
                    onClick={() => onRemoveOccurrence(event)}
                  >
                    <CalendarX className="size-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Editar ${event.title}`}
                  onClick={() => onStartEdit(event)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!editing && ordered.length > 0 && (
        <Button size="sm" variant="outline" className="w-full" onClick={onStartCreate}>
          <Plus className="size-3.5" /> Adicionar compromisso
        </Button>
      )}
    </div>
  );
}
