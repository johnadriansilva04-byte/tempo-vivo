import { WEEKDAYS, dayDensity, monthGrid } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

/** Quantos chips cabem sem esticar a linha — o resto vira "+N". */
const CHIPS = 2;

/**
 * Calendário mensal compacto: altura fixa por dia, poucos chips e um contador.
 * O objetivo é o mês inteiro caber na tela — o detalhe abre no painel do dia.
 */
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
          const density = dayDensity(dayEvents.length);
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${cell.day}, ${dayEvents.length} compromisso${dayEvents.length === 1 ? "" : "s"}`}
              className={cn(
                "calendar-day",
                !cell.inMonth && "calendar-day-out",
                isToday && "calendar-day-today",
                isSelected && "calendar-day-selected",
                density > 0 && `calendar-day-d${density}`,
              )}
            >
              <span className="calendar-day-head">
                <span className="calendar-day-number">{cell.day}</span>
                {dayEvents.length > 0 && (
                  <span className="calendar-day-count">{dayEvents.length}</span>
                )}
              </span>
              <span className="calendar-day-events">
                {dayEvents.slice(0, CHIPS).map((event) => (
                  <span className="calendar-event" key={event.id}>
                    <b>{event.start_time.slice(0, 5)}</b>
                    {event.title}
                  </span>
                ))}
                {dayEvents.length > CHIPS && (
                  <span className="calendar-more">+{dayEvents.length - CHIPS}</span>
                )}
              </span>
              {dayEvents.length > 0 && <span className="calendar-density" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
