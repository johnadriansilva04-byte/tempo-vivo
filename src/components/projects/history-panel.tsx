import { eventLabel, formatDateTime } from "@/components/projects/status";
import type { ProjectEvent } from "@/types/projects";

/** Histórico cronológico do projeto — alimentado por eventos persistidos. */
export function HistoryPanel({ events }: { events: ProjectEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="relative border-l border-border pl-4">
          <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-foreground">
              {eventLabel(event.event_type)}
            </span>
            <span className="text-[11px] text-faint">
              {formatDateTime(event.created_at)}
            </span>
          </div>
          {event.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {event.description}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
