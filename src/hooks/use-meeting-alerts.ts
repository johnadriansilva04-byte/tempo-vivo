import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playMeetingAlert } from "@/lib/notification-sound";
import { useMeetingRequests } from "@/hooks/use-meeting-requests";

// ---------------------------------------------------------------------------
// Vigia de pedidos de reunião.
//
// O dono pode estar em qualquer tela do app. Quando um pedido novo chega
// (alguém clicou no link público e escolheu um horário), o app toca o alerta e
// mostra o aviso — o pedido não pode passar despercebido.
//
// O aviso é idempotente: o conjunto de pedidos já vistos e o "último avisado"
// vivem no módulo, então dois componentes que usem este hook (a casca e o menu)
// não tocam o som duas vezes pelo mesmo pedido. A primeira carga só registra o
// que já existia; o som é para o que CHEGA enquanto o app está vivo.
// ---------------------------------------------------------------------------

const seenIds = new Set<string>();
let primed = false;
let lastAlertedId: string | null = null;

export function useMeetingAlerts(): { pendingCount: number } {
  const { requests } = useMeetingRequests();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");

  useEffect(() => {
    // Primeira resposta: só anota os pedidos já existentes, sem alarde.
    if (!primed) {
      for (const r of pending) seenIds.add(r.id);
      primed = true;
      return;
    }
    const novos = pending.filter((r) => !seenIds.has(r.id));
    for (const r of pending) seenIds.add(r.id);
    if (novos.length === 0 || !mounted.current) return;
    const primeiro = novos[0];
    if (primeiro && primeiro.id === lastAlertedId) return;
    if (primeiro) lastAlertedId = primeiro.id;

    playMeetingAlert();
    toast(
      novos.length === 1
        ? `Novo pedido de reunião — ${primeiro?.requester_name ?? "alguém"}`
        : `${novos.length} novos pedidos de reunião`,
      {
        description: "Abra “Agenda” para aprovar ou recusar.",
        duration: 10_000,
      },
    );
  }, [pending]);

  return { pendingCount: pending.length };
}
