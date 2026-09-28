import { useState } from "react";
import { Check, CalendarClock, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/page-kit";
import {
  useDecideMeeting,
  useMeetingRequests,
} from "@/hooks/use-meeting-requests";
import { todayIso } from "@/lib/schedule";
import type { MeetingRequest } from "@/types/profile";

const STATUS_META: Record<
  MeetingRequest["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pendente", className: "status-review" },
  ACCEPTED: { label: "Aceita", className: "status-open" },
  DECLINED: { label: "Recusada", className: "status-archive" },
  CANCELLED: { label: "Cancelada", className: "status-archive" },
  RESCHEDULED: { label: "Contraproposta", className: "status-open" },
};

/**
 * Solicitações de reunião recebidas de visitantes do perfil público.
 * ACEITAR coloca a reunião na agenda e remove o horário da disponibilidade.
 */
export function MeetingRequestsPanel() {
  const { requests, isLoading } = useMeetingRequests();
  const decide = useDecideMeeting();
  const [counterFor, setCounterFor] = useState<MeetingRequest | null>(null);
  const [counterDraft, setCounterDraft] = useState({
    counter_event_date: todayIso(),
    counter_start_time: "10:00",
    counter_end_time: "11:00",
    counter_note: "",
  });

  const act = (
    id: string,
    decision: Parameters<typeof decide.mutate>[0]["decision"],
    successMsg: string,
  ) => {
    decide.mutate(
      { id, decision },
      {
        onSuccess: () => toast.success(successMsg),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Falha ao responder."),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
    );
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const answered = requests.filter((r) => r.status !== "PENDING");

  return (
    <Section
      title="Solicitações de reunião"
      detail="Visitantes do seu link público pedem horários — você aceita, recusa ou propõe outro"
    >
      {requests.length === 0 ? (
        <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-sm text-faint">
          <Inbox className="size-3.5" />
          Nenhuma solicitação ainda. Ative “receber reuniões” e divulgue seu
          link público.
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-display text-sm font-semibold tabular-nums text-primary">
                  {r.event_date} · {r.start_time} — {r.end_time}
                </span>
                <span className="text-sm font-medium">{r.requester_name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.requester_contact}
                </span>
                <span className={`status ${STATUS_META[r.status].className}`}>
                  {STATUS_META[r.status].label}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {r.reason}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() =>
                    act(
                      r.id,
                      { status: "ACCEPTED" },
                      "Reunião aceita — entrou na agenda.",
                    )
                  }
                >
                  <Check className="size-3.5" /> Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={decide.isPending}
                  onClick={() =>
                    act(r.id, { status: "DECLINED" }, "Solicitação recusada.")
                  }
                >
                  <X className="size-3.5" /> Recusar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={decide.isPending}
                  onClick={() => setCounterFor(r)}
                >
                  <CalendarClock className="size-3.5" /> Propor outro horário
                </Button>
              </div>
            </article>
          ))}

          {counterFor && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                Contraproposta para {counterFor.requester_name}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <Input
                  type="date"
                  min={todayIso()}
                  value={counterDraft.counter_event_date}
                  onChange={(e) =>
                    setCounterDraft({
                      ...counterDraft,
                      counter_event_date: e.target.value,
                    })
                  }
                  aria-label="Nova data"
                />
                <Input
                  type="time"
                  value={counterDraft.counter_start_time}
                  onChange={(e) =>
                    setCounterDraft({
                      ...counterDraft,
                      counter_start_time: e.target.value,
                    })
                  }
                  aria-label="Novo início"
                />
                <Input
                  type="time"
                  value={counterDraft.counter_end_time}
                  onChange={(e) =>
                    setCounterDraft({
                      ...counterDraft,
                      counter_end_time: e.target.value,
                    })
                  }
                  aria-label="Novo fim"
                />
                <Input
                  value={counterDraft.counter_note}
                  onChange={(e) =>
                    setCounterDraft({
                      ...counterDraft,
                      counter_note: e.target.value,
                    })
                  }
                  placeholder="Recado (opcional)"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() => {
                    const id = counterFor.id;
                    setCounterFor(null);
                    act(
                      id,
                      {
                        status: "RESCHEDULED",
                        counter_event_date: counterDraft.counter_event_date,
                        counter_start_time: counterDraft.counter_start_time,
                        counter_end_time: counterDraft.counter_end_time,
                        counter_note: counterDraft.counter_note,
                      },
                      "Contraproposta enviada.",
                    );
                  }}
                >
                  Enviar contraproposta
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCounterFor(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {answered.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm"
            >
              <span className="tabular-nums text-muted-foreground">
                {r.event_date} · {r.start_time} — {r.end_time}
              </span>
              <span className="font-medium">{r.requester_name}</span>
              <span className={`status ${STATUS_META[r.status].className}`}>
                {STATUS_META[r.status].label}
              </span>
              {r.status === "RESCHEDULED" && r.counter_event_date && (
                <span className="text-xs text-primary">
                  contraproposta: {r.counter_event_date} ·{" "}
                  {r.counter_start_time}—{r.counter_end_time}
                </span>
              )}
              {r.status === "RESCHEDULED" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  disabled={decide.isPending}
                  onClick={() =>
                    act(
                      r.id,
                      {
                        status: "ACCEPTED",
                        counter_event_date: r.counter_event_date,
                        counter_start_time: r.counter_start_time,
                        counter_end_time: r.counter_end_time,
                      },
                      "Contraproposta aceita — reunião entrou na agenda.",
                    )
                  }
                >
                  Aceitar contraproposta
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
