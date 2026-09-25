import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTHS,
  WEEKDAYS,
  dayDensity,
  eventsByDayInRange,
  fromIso,
  monthGrid,
  toIso,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { AgendaEvent } from "@/types/profile";

/** Quantos chips cabem sem crescer a célula. */
const CHIPS = 2;

function shiftMonth(iso: string, delta: number): string {
  const d = fromIso(iso);
  d.setMonth(d.getMonth() + delta, 1);
  return toIso(d);
}

function dayLabelOf(iso: string): string {
  return fromIso(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Agenda pública somente leitura: o mesmo calendário do app, sem edição.
 * Clicar num dia abre a lista completa daquele dia (revelação expansível) —
 * o visitante vê a rotina de quem compartilhou, inclusive escalas repetidas.
 */
export function PublicAgenda({ events }: { events: AgendaEvent[] }) {
  const today = toIso(new Date());
  const [anchor, setAnchor] = useState(today);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const cells = useMemo(() => monthGrid(anchor), [anchor]);
  const eventsByDay = useMemo(
    () =>
      eventsByDayInRange(events, cells[0]?.iso ?? anchor, cells[cells.length - 1]?.iso ?? anchor),
    [events, cells, anchor],
  );

  const monthLabel = `${MONTHS[fromIso(anchor).getMonth()]} ${fromIso(anchor).getFullYear()}`;
  const dayEvents = openDay ? (eventsByDay.get(openDay) ?? []) : [];

  return (
    <div className="public-agenda">
      <div className="public-agenda-head">
        <button
          type="button"
          className="public-agenda-nav"
          aria-label="Mês anterior"
          onClick={() => {
            setAnchor((a) => shiftMonth(a, -1));
            setOpenDay(null);
          }}
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-display text-sm font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          className="public-agenda-nav"
          aria-label="Próximo mês"
          onClick={() => {
            setAnchor((a) => shiftMonth(a, 1));
            setOpenDay(null);
          }}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="calendar">
        <div className="calendar-weekdays">
          {WEEKDAYS.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((cell) => {
            const list = eventsByDay.get(cell.iso) ?? [];
            const density = dayDensity(list.length);
            const open = openDay === cell.iso;
            return (
              <button
                key={cell.iso}
                type="button"
                aria-expanded={open}
                aria-label={`${cell.day}, ${list.length} compromisso${list.length === 1 ? "" : "s"}`}
                onClick={() => setOpenDay(open ? null : cell.iso)}
                className={cn(
                  "calendar-day",
                  !cell.inMonth && "calendar-day-out",
                  cell.iso === today && "calendar-day-today",
                  open && "calendar-day-selected",
                  density > 0 && `calendar-day-d${density}`,
                )}
              >
                <span className="calendar-day-head">
                  <span className="calendar-day-number">{cell.day}</span>
                  {list.length > 0 && <span className="calendar-day-count">{list.length}</span>}
                </span>
                <span className="calendar-day-events">
                  {list.slice(0, CHIPS).map((event) => (
                    <span className="calendar-event" key={event.id}>
                      <b>{event.start_time.slice(0, 5)}</b>
                      {event.title}
                    </span>
                  ))}
                  {list.length > CHIPS && (
                    <span className="calendar-more">+{list.length - CHIPS}</span>
                  )}
                </span>
                {list.length > 0 && <span className="calendar-density" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {openDay && (
        <div className="public-day">
          <p className="public-day-title">
            <CalendarDays className="size-3.5" />
            {dayLabelOf(openDay)}
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </p>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dia livre.</p>
          ) : (
            <ul className="public-day-list">
              {dayEvents.map((event) => (
                <li key={event.id}>
                  <span className="public-day-time">{event.start_time.slice(0, 5)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{event.title}</span>
                    {(event.end_time || event.location) && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {[event.end_time && `até ${event.end_time}`, event.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
