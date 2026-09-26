import { useState } from "react";
import { CalendarCheck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequestMeeting } from "@/hooks/use-meeting-requests";
import {
  formatDayMonth,
  freeSlots,
  nextOpenDates,
  openDays,
  todayIso,
  weekdayName,
} from "@/lib/meetings";
import { cn } from "@/lib/utils";
import type { AgendaEvent, MeetingAvailability } from "@/types/profile";

/**
 * Pedido de reunião no perfil público. O visitante escolhe um dia aberto e um
 * horário livre — sem calendário para rolar, só as próximas datas possíveis.
 * O pedido nasce pendente: quem decide é o dono, na aba Solicitações.
 */
export function PublicMeetingForm({
  handle,
  availability,
  events,
}: {
  handle: string;
  availability: MeetingAvailability;
  events: AgendaEvent[];
}) {
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);
  const send = useRequestMeeting();

  if (!availability.enabled) return null;

  const days = nextOpenDates(availability, todayIso(), 5);
  const slots = date ? freeSlots(availability, events, date) : [];
  const openWeekdays = openDays(availability);
  const valid = Boolean(date && time && name.trim() && phone.trim());

  const submit = () => {
    if (!valid || !date || !time) return;
    send.mutate(
      {
        host_handle: handle,
        requester_name: name.trim(),
        requester_phone: phone.trim(),
        subject: subject.trim(),
        location: "",
        notes: "",
        meeting_date: date,
        meeting_time: time,
      },
      { onSuccess: () => setSent(true) },
    );
  };

  if (sent) {
    return (
      <div className="meet-done">
        <span className="meet-done-icon">
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Pedido enviado</p>
          <p className="text-xs text-muted-foreground">
            {date ? `${formatDayMonth(date)} às ${time}` : ""} — aguarde a confirmação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="meet-form">
      <header className="meet-form-head">
        <CalendarCheck className="size-4" />
        <h3 className="text-sm font-semibold">Pedir reunião</h3>
        {openWeekdays.length > 0 && (
          <span className="meet-days">
            {openWeekdays.map((d) => weekdayName(d).slice(0, 3)).join(" · ")}
          </span>
        )}
      </header>

      <div className="meet-dates">
        {days.map((iso) => (
          <button
            key={iso}
            type="button"
            className={cn("meet-date", date === iso && "selected")}
            onClick={() => {
              setDate(iso);
              setTime(null);
            }}
          >
            <b>{formatDayMonth(iso)}</b>
            <span>{weekdayName(new Date(`${iso}T12:00:00`).getDay()).slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {date && (
        <div className="meet-slots">
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem horário livre neste dia.</p>
          ) : (
            slots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={cn("meet-slot", time === slot && "selected")}
                onClick={() => setTime(slot)}
              >
                {slot}
              </button>
            ))
          )}
        </div>
      )}

      <div className="meet-fields">
        <input
          className="meet-input"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="meet-input"
          placeholder="Telefone"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="meet-input meet-input-wide"
          placeholder="Assunto (opcional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <Button size="sm" disabled={!valid || send.isPending} onClick={submit}>
        {send.isPending && <Loader2 className="size-3.5 animate-spin" />}
        Enviar pedido
      </Button>
      {send.isError && (
        <p className="text-xs text-destructive">Não foi possível enviar. Tente de novo.</p>
      )}
    </section>
  );
}
