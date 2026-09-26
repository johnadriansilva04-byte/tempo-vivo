import { Check, Clock, Phone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  useAcceptMeeting,
  useDeclineMeeting,
  useMeetingRequests,
  useRemoveMeetingRequest,
} from "@/hooks/use-meeting-requests";
import { formatDayMonth, weekdayName } from "@/lib/meetings";
import { fromIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { MeetingRequest } from "@/types/profile";

/**
 * Aba Solicitações: pedidos de reunião recebidos no perfil público.
 * Aceitar cria o compromisso na agenda; recusar só fecha o pedido.
 */
export function MeetingRequestsPanel({ onAccepted }: { onAccepted?: (date: string) => void }) {
  const { requests, isLoading } = useMeetingRequests();
  const accept = useAcceptMeeting();
  const decline = useDeclineMeeting();
  const remove = useRemoveMeetingRequest();

  if (isLoading) return null;

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="size-5" />}
        title="Nenhum pedido de reunião"
        description="Quando alguém pedir uma reunião no seu perfil público, o pedido aparece aqui para você aceitar ou recusar."
      />
    );
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="meet-admin">
      {pending.length > 0 && (
        <div className="meet-admin-group">
          <h3 className="meet-admin-title">
            Pendentes <span className="meet-admin-count">{pending.length}</span>
          </h3>
          {pending.map((request) => (
            <article className="meet-card" key={request.id}>
              <div className="meet-card-when">
                <b>{formatDayMonth(request.meeting_date)}</b>
                <span>{request.meeting_time}</span>
                <span className="meet-card-weekday">
                  {weekdayName(fromIso(request.meeting_date).getDay()).slice(0, 3)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{request.requester_name}</p>
                {request.subject.trim() !== "" && (
                  <p className="truncate text-xs text-muted-foreground">{request.subject}</p>
                )}
                {request.requester_phone.trim() !== "" && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {request.requester_phone}
                  </p>
                )}
              </div>
              <div className="meet-card-actions">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={accept.isPending}
                  onClick={() =>
                    accept.mutate(request, { onSuccess: () => onAccepted?.(request.meeting_date) })
                  }
                >
                  <Check className="size-3.5" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={decline.isPending}
                  onClick={() => decline.mutate(request)}
                >
                  <X className="size-3.5" />
                  Recusar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="meet-admin-group">
          <h3 className="meet-admin-title">Resolvidos</h3>
          {decided.map((request) => (
            <DecidedCard
              key={request.id}
              request={request}
              onRemove={() => remove.mutate(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DecidedCard({ request, onRemove }: { request: MeetingRequest; onRemove: () => void }) {
  const accepted = request.status === "CONFIRMED";
  return (
    <article className="meet-card meet-card-done">
      <span className={cn("status", accepted ? "status-open" : "status-neutral")}>
        {accepted ? "Confirmada" : "Recusada"}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">
        {request.requester_name}
        <span className="text-muted-foreground">
          {" "}
          · {formatDayMonth(request.meeting_date)} às {request.meeting_time}
        </span>
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Remover pedido"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </article>
  );
}
