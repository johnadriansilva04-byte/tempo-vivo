import { WEEKDAYS, monthGrid } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

/** Calendário mensal: dias numerados, hoje destacado, eventos dentro dos dias. */
export function MonthGrid({
  iso,
  selected,
  today,
  eventsByDay,
  onSelect,
}: {
  /** Qualquer dia do mês exibido. */
  iso: string;
  selected: string;
  today: string;
  eventsByDay: Map<string, AgendaEvent[]>;
  onSelect: (iso: string) => void;
}) {
  const cells = monthGrid(iso);

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.iso) ?? [];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selected;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "calendar-day",
                !cell.inMonth && "calendar-day-out",
                isToday && "calendar-day-today",
                isSelected && "calendar-day-selected",
              )}
            >
              <span className="calendar-day-number">{cell.day}</span>
              <span className="calendar-day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <span className="calendar-event" key={event.id}>
                    <b>{event.start_time.slice(0, 5)}</b>
                    {event.title}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="calendar-more">+{dayEvents.length - 3}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
