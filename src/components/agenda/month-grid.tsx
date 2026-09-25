import { useRef } from "react";
import { WEEKDAYS, addDays, dayDensity, monthGrid } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

/** Quantos chips cabem sem esticar a linha — o resto vira "+N". */
const CHIPS = 2;

/** Deslocamento em dias para cada seta do teclado. */
const ARROW_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/**
 * Calendário mensal compacto: altura fixa por dia, poucos chips e um contador.
 * O objetivo é o mês inteiro caber na tela — o detalhe abre no painel do dia.
 * Setas do teclado percorrem os dias; Enter abre o dia em foco.
 */
export function MonthGrid({
  iso,
  selected,
  today,
  eventsByDay,
  onSelect,
  onMove,
}: {
  /** Qualquer dia do mês exibido. */
  iso: string;
  selected: string;
  today: string;
  eventsByDay: Map<string, AgendaEvent[]>;
  onSelect: (iso: string) => void;
  /** Navegação por teclado: move o foco sem abrir o painel. */
  onMove?: (iso: string) => void;
}) {
  const cells = monthGrid(iso);
  const gridRef = useRef<HTMLDivElement>(null);

  const move = (fromIso: string, delta: number) => {
    const next = addDays(fromIso, delta);
    (onMove ?? onSelect)(next);
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${next}"]`)?.focus();
    });
  };

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((label, i) => (
          <span key={`${label}-${i}`}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid" ref={gridRef}>
        {cells.map((cell) => {
          const dayEvents = eventsByDay.get(cell.iso) ?? [];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selected;
          const density = dayDensity(dayEvents.length);
          return (
            <button
              key={cell.iso}
              type="button"
              data-iso={cell.iso}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(cell.iso)}
              onKeyDown={(e) => {
                const delta = ARROW_STEP[e.key];
                if (delta === undefined) return;
                e.preventDefault();
                move(cell.iso, delta);
              }}
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
