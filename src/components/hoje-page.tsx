import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Inbox,
  Link2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-kit";
import { DayAgenda } from "@/components/schedule-kit";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useMeetingAlerts } from "@/hooks/use-meeting-alerts";
import { useAvailabilityRules, useFreeSlots } from "@/hooks/use-availability";
import {
  useTodayTomorrow,
  useRecurringCommitments,
} from "@/hooks/use-schedule";
import { useMeetingRequests } from "@/hooks/use-meeting-requests";
import { toMinutes, WEEKDAY_SHORT, formatDayLabel } from "@/lib/schedule";
import { primeNotificationSound } from "@/lib/notification-sound";

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Tela inicial do dono: o dia de hoje e o de amanhã, o próximo compromisso e o
 * que ainda precisa de decisão. É uma agenda — nada além disso aparece aqui.
 */
export function HojePage() {
  const { profile } = useProfile();
  const { today, tomorrow, occurrencesToday, occurrencesTomorrow } =
    useTodayTomorrow();
  const { commitments } = useRecurringCommitments();
  const { rules } = useAvailabilityRules();
  const slotsToday = useFreeSlots(today);
  const slotsTomorrow = useFreeSlots(tomorrow);
  const { requests } = useMeetingRequests();
  const { pendingCount } = useMeetingAlerts();
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(nowMinutes);

  // O relógio anda enquanto a tela está aberta — "próximo compromisso" não mente.
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const next =
    occurrencesToday.find((o) => toMinutes(o.start_time) >= now) ??
    occurrencesTomorrow[0] ??
    null;
  const nextIsTomorrow = !occurrencesToday.some(
    (o) => toMinutes(o.start_time) >= now,
  );

  const activeCommitments = commitments.filter((c) => c.is_active);
  const openWeekdays = rules
    .filter((r) => r.is_available)
    .map((r) => r.weekday)
    .sort((a, b) => a - b);

  const slug = (profile?.slug ?? "").trim();
  const publicUrl =
    slug === ""
      ? null
      : `${typeof window !== "undefined" ? window.location.origin : ""}/u/${slug}`;

  const copyPublicUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar — copie manualmente.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Hoje"
        title={`Olá${profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}`}
        description={formatDayLabel(today)}
        {...(publicUrl
          ? {
              action: (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyPublicUrl}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copiar meu link
                  </button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/u/$slug" params={{ slug }}>
                      <Link2 className="size-3.5" /> Ver link
                    </Link>
                  </Button>
                </div>
              ),
            }
          : {})}
      />

      {pendingCount > 0 && (
        <Link
          to="/agenda"
          className="mb-6 flex items-center gap-3 rounded-lg border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Inbox className="size-4 shrink-0" />
          <span className="flex-1">
            {pendingCount === 1
              ? "1 pessoa pediu uma reunião com você"
              : `${pendingCount} pessoas pediram reunião com você`}
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      {next ? (
        <div className="quiet-panel mb-6 border-l-2 border-primary">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Clock3 className="size-3.5" />
            Próximo compromisso · {nextIsTomorrow ? "amanhã" : "hoje"}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-2xl font-semibold tabular-nums text-primary">
              {next.start_time}
            </span>
            <span className="font-display text-lg font-semibold">
              {next.title}
            </span>
            <span className="status status-neutral">{next.category}</span>
          </div>
        </div>
      ) : (
        <div className="quiet-panel mb-6">
          <p className="text-sm text-muted-foreground">
            Nada marcado para hoje ou amanhã.{" "}
            <Link
              to="/agenda"
              className="font-medium text-primary underline underline-offset-2"
            >
              Monte sua rotina
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <DayAgenda
          title="Hoje"
          dateIso={today}
          occurrences={occurrencesToday}
          emptyLabel="Dia livre."
        />
        <DayAgenda
          title="Amanhã"
          dateIso={tomorrow}
          occurrences={occurrencesTomorrow}
          emptyLabel="Dia livre."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-faint">
              Minha rotina
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeCommitments.length === 0
              ? "Você ainda não definiu seus compromissos fixos."
              : `${activeCommitments.length} compromisso(s) fixo(s) na semana.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeCommitments.slice(0, 6).map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
              >
                <span className="font-display font-semibold tabular-nums text-primary">
                  {c.start_time}
                </span>
                <span className="max-w-[10rem] truncate">{c.title}</span>
              </span>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-4 px-0" asChild>
            <Link to="/agenda">
              Abrir agenda <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-faint">
              Quando estou disponível
            </h2>
          </div>
          {openWeekdays.length === 0 ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum dia aberto para reuniões. Quem entra no seu link não vê
                horário nenhum.
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link to="/configuracoes">Abrir horários</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {openWeekdays.map((wd) => (
                  <span key={wd} className="status status-open">
                    {WEEKDAY_SHORT[wd % 7]}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border bg-background px-3 py-2">
                  <p className="text-[11px] text-faint">Hoje</p>
                  <p className="font-display font-semibold text-primary">
                    {slotsToday.slices.length > 0
                      ? `${slotsToday.slices.length} horário(s)`
                      : slotsToday.free.length > 0
                        ? "janela aberta"
                        : "fechado"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background px-3 py-2">
                  <p className="text-[11px] text-faint">Amanhã</p>
                  <p className="font-display font-semibold text-primary">
                    {slotsTomorrow.slices.length > 0
                      ? `${slotsTomorrow.slices.length} horário(s)`
                      : slotsTomorrow.free.length > 0
                        ? "janela aberta"
                        : "fechado"}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="mt-4 px-0" asChild>
                <Link to="/configuracoes">
                  Ajustar disponibilidade <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs text-faint">
        {requests.length > 0
          ? `${requests.length} pedido(s) de reunião no total.`
          : "Quando alguém pedir uma reunião, você é avisado na hora — com som."}{" "}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={primeNotificationSound}
        >
          Testar aviso
        </button>
      </p>
    </>
  );
}
