import { Clock3, MapPin, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/agenda/event-form";
import type { EventDraft } from "@/components/agenda/draft";
import { byStartTime, dayLabel, timeLabel } from "@/lib/calendar";
import { isPlaceholderText } from "@/lib/placeholder";
import type { AgendaEvent } from "@/types/profile";

/** Lista + edição dos compromissos de um dia. Burro: só mostra e delega. */
export function DayPanel({
  iso,
  events,
  editing,
  draft,
  pending,
  onDraftChange,
  onStartEdit,
  onStartCreate,
  onSave,
  onDelete,
  onCancel,
}: {
  iso: string;
  events: AgendaEvent[];
  editing: boolean;
  draft: EventDraft | null;
  pending: boolean;
  onDraftChange: (draft: EventDraft) => void;
  onStartEdit: (event: AgendaEvent) => void;
  onStartCreate: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}) {
  const ordered = byStartTime(events);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold capitalize text-foreground">
          {dayLabel(iso)}
        </h2>
        {!editing && (
          <Button size="sm" variant="outline" onClick={onStartCreate}>
            <Plus className="size-3.5" /> Evento
          </Button>
        )}
      </div>

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
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Nenhum compromisso neste dia.
        </p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((event) => (
            <li key={event.id} className="event-row">
              <span className="event-time">{timeLabel(event.start_time)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {isPlaceholderText(event.title) ? "" : event.title}
                </p>
                {(event.location || event.notes) && (
                  <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                    {event.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {event.location}
                      </span>
                    )}
                    {event.end_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        até {timeLabel(event.end_time)}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 shrink-0"
                aria-label={`Editar ${event.title}`}
                onClick={() => onStartEdit(event)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
