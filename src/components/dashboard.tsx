import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Hourglass,
  FolderKanban,
  Inbox,
  LayoutGrid,
  Link2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConsistencyHeatmap } from "@/components/consistency-heatmap";
import { DayGreeting } from "@/components/day-greeting";
import { EmptyState } from "@/components/empty-state";
import { ExpandingSection } from "@/components/expanding-section";
import { GamificationPanel } from "@/components/gamification-panel";
import { ProfileCompleteness } from "@/components/profile-completeness";
import { ProfileHeader } from "@/components/profile-header";
import { LifetimeTracker } from "@/components/lifetime-tracker";
import { DayAgenda } from "@/components/schedule-kit";
import { Metric, ProgressBar } from "@/components/page-kit";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { useProfile } from "@/hooks/use-profile";
import {
  useTodayTomorrow,
  useRecurringCommitments,
  useCommitmentExceptions,
  useOneOffEvents,
} from "@/hooks/use-schedule";
import { useAvailabilityRules, useFreeSlots } from "@/hooks/use-availability";
import { useMeetingRequests } from "@/hooks/use-meeting-requests";
import {
  addDaysIso,
  occurrencesForDate,
  toMinutes,
  todayIso,
  WEEKDAY_SHORT,
} from "@/lib/schedule";

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Card compacto do próximo compromisso — resposta imediata a "o que vem agora?". */
function NextCommitment({
  label,
  time,
  title,
  category,
}: {
  label: string;
  time: string;
  title: string;
  category: string;
}) {
  return (
    <div className="quiet-panel border-l-2 border-primary">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
        <Clock3 className="size-3.5" /> Próximo compromisso · {label}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-2xl font-semibold tabular-nums text-primary">
          {time}
        </span>
        <span className="font-display text-lg font-semibold">{title}</span>
        <span className="status status-neutral">{category}</span>
      </div>
    </div>
  );
}

/**
 * Dashboard enxuto: o essencial na tela (saudação, próximo compromisso,
 * hoje/amanhã) e todo o resto em seções que expandem no lugar — sem poluir
 * e sem rolar a página.
 */
export function DashboardPage() {
  const { profile } = useProfile();
  const { logs } = useDailyLogs();
  const { projects } = useProjects();
  const { milestones } = useMilestones();
  const {
    today,
    tomorrow,
    occurrencesToday,
    occurrencesTomorrow,
    isLoading: scheduleLoading,
  } = useTodayTomorrow();
  const { commitments } = useRecurringCommitments();
  const { exceptions } = useCommitmentExceptions();
  const { events } = useOneOffEvents();
  const { rules } = useAvailabilityRules();
  const slotsToday = useFreeSlots(today);
  const slotsTomorrow = useFreeSlots(tomorrow);
  const { requests } = useMeetingRequests();
  const [copied, setCopied] = useState(false);

  const pendingMeetings = requests.filter((r) => r.status === "PENDING").length;

  const next = useMemo(() => {
    const n = nowMinutes();
    const todayNext = occurrencesToday.find(
      (o) => toMinutes(o.start_time) >= n,
    );
    if (todayNext) return { label: "hoje", occurrence: todayNext };
    const tomorrowFirst = occurrencesTomorrow[0];
    if (tomorrowFirst) return { label: "amanhã", occurrence: tomorrowFirst };
    return null;
  }, [occurrencesToday, occurrencesTomorrow]);

  // Próximas atividades: 7 dias de agenda concreta (regra + exceções + eventos).
  const upcoming = useMemo(() => {
    const out: { date: string; title: string; time: string }[] = [];
    const base = todayIso();
    for (let i = 0; i < 7; i++) {
      const date = addDaysIso(base, i);
      if (date === today) continue;
      const occ = occurrencesForDate(date, commitments, exceptions, events);
      for (const o of occ.slice(0, 2)) {
        out.push({ date, title: o.title, time: o.start_time });
      }
      if (out.length >= 6) break;
    }
    return out.slice(0, 6);
  }, [today, commitments, exceptions, events]);

  const activeProjects = projects
    .filter((p) => p.status !== "Concluído")
    .slice(0, 4);
  const latestMilestone = milestones[0];
  const availableWeekdays = rules
    .filter((r) => r.is_available)
    .map((r) => r.weekday)
    .sort();
  const daysWithSummary = logs.filter(
    (l) => l.summary_text.trim() !== "",
  ).length;
  const summaryPct =
    logs.length === 0 ? 0 : Math.round((daysWithSummary / logs.length) * 100);
  const acceptedMeetings = requests.filter(
    (r) => r.status === "ACCEPTED",
  ).length;
  const doneProjects = projects.filter((p) => p.status === "Concluído").length;

  const publicSlug = (profile?.slug ?? "").trim();
  const publicUrl =
    publicSlug !== ""
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${publicSlug}`
      : null;

  const copyPublicUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link público copiado.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar — copie manualmente.");
    }
  };

  // Linhas-resumo das seções expansíveis (estado em uma frase, sem poluir).
  const agendaSummary =
    upcoming.length > 0
      ? `${upcoming.length} compromisso(s) nos próximos dias`
      : "Sua rotina recorrente aparece aqui";
  const projectsSummary =
    activeProjects.length > 0
      ? activeProjects.map((p) => p.name).join(" · ")
      : "Nenhum projeto em movimento";
  const milestoneSummary = latestMilestone
    ? `${latestMilestone.year} · ${latestMilestone.title}`
    : "Nada registrado ainda";
  const numbersSummary = `${logs.length} dias · ${milestones.length} realizações · ${doneProjects} projetos concluídos`;
  const availabilitySummary =
    pendingMeetings > 0
      ? `${availableWeekdays.length} dia(s) aberto(s) · ${pendingMeetings} pedido(s) aguardando`
      : availableWeekdays.length > 0
        ? `${availableWeekdays.length} dia(s) aberto(s) para reuniões`
        : "Abra dias e horários para receber pedidos";
  const publicLinkSummary = publicUrl
    ? `perfilvivo.com/u/${publicSlug}`
    : "Defina seu nome de link";

  return (
    <>
      <ProfileHeader compact />

      <div className="mt-6">
        <DayGreeting />
      </div>

      <div className="mt-2 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        {/* Coluna esquerda — o essencial do dia */}
        <div className="space-y-5">
          {next && next.occurrence ? (
            <NextCommitment
              label={next.label}
              time={next.occurrence.start_time}
              title={next.occurrence.title}
              category={next.occurrence.category}
            />
          ) : !scheduleLoading ? (
            <div className="quiet-panel">
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso marcado para hoje ou amanhã.{" "}
                <Link
                  to="/agenda"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Defina sua rotina recorrente na Agenda
                </Link>
                .
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <DayAgenda
              title="Hoje"
              dateIso={today}
              occurrences={occurrencesToday}
              emptyLabel="Dia livre — nenhum compromisso."
            />
            <DayAgenda
              title="Amanhã"
              dateIso={tomorrow}
              occurrences={occurrencesTomorrow}
              emptyLabel="Dia livre — nenhum compromisso."
            />
          </div>

          {/* Um toque no essencial numérico — o resto se expande abaixo */}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-5">
            <Metric value={String(logs.length)} label="Dias registrados" />
            <Metric
              value={String(commitments.filter((c) => c.is_active).length)}
              label="Compromissos fixos"
            />
            <Metric value={String(milestones.length)} label="Realizações" />
          </div>
        </div>

        {/* Coluna direita — seções que se expandem no lugar */}
        <div className="space-y-2.5">
          <ExpandingSection
            title="Próximas atividades"
            icon={<CalendarDays className="size-4" />}
            summary={agendaSummary}
            description="O que sua rotina já reserva nos próximos 7 dias"
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-faint">
                Sua rotina recorrente aparece aqui assim que você criar
                compromissos na{" "}
                <Link
                  to="/agenda"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Agenda
                </Link>
                .
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {upcoming.map((a, i) => (
                  <div
                    key={`${a.date}-${i}`}
                    className="flex items-center gap-4 px-4 py-2.5 text-sm"
                  >
                    <span className="w-24 shrink-0 text-xs text-muted-foreground first-letter:capitalize">
                      {new Date(`${a.date}T00:00:00`).toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        },
                      )}
                    </span>
                    <span className="w-14 shrink-0 font-display font-semibold tabular-nums text-primary">
                      {a.time}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </ExpandingSection>

          <ExpandingSection
            title="Projetos ativos"
            icon={<FolderKanban className="size-4" />}
            summary={projectsSummary}
            description="O que está em movimento agora"
          >
            {activeProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-5" />}
                title="Nenhum projeto ativo"
                description="Crie seu primeiro projeto e ele aparece aqui com o progresso real."
                actionLabel="Ir para Projetos"
                onAction={() => (window.location.href = "/projetos")}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeProjects.map((p) => (
                  <Link
                    to="/projetos"
                    key={p.name}
                    className="card-interactive"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="status status-neutral">{p.status}</span>
                      <ArrowRight className="size-4 text-faint" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold">
                      {p.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {p.description}
                    </p>
                    <div className="mt-4">
                      <ProgressBar value={p.progress} />
                    </div>
                    <p className="mt-1.5 text-xs text-faint">
                      {p.progress}% concluído
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </ExpandingSection>

          <ExpandingSection
            title="Última realização"
            icon={<Trophy className="size-4" />}
            summary={milestoneSummary}
            description="O que você já concretizou"
          >
            {latestMilestone ? (
              <div className="quiet-panel">
                <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground">
                  <Trophy className="size-3.5" />
                  {latestMilestone.year} · {latestMilestone.category}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {latestMilestone.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {latestMilestone.description}
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-faint">
                <Sparkles className="size-3.5" />
                Nenhuma realização registrada ainda — comece em{" "}
                <Link
                  to="/realizacoes"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Realizações
                </Link>
                .
              </p>
            )}
          </ExpandingSection>

          <ExpandingSection
            title="Em números"
            icon={<LayoutGrid className="size-4" />}
            summary={numbersSummary}
            description="A trajetória inteira em seis medidas"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-7">
              <Metric value={String(logs.length)} label="Dias registrados" />
              <Metric
                value={String(commitments.filter((c) => c.is_active).length)}
                label="Compromissos fixos"
              />
              <Metric value={String(milestones.length)} label="Realizações" />
              <Metric
                value={String(doneProjects)}
                label="Projetos concluídos"
              />
              <Metric
                value={String(acceptedMeetings)}
                label="Reuniões realizadas"
              />
              <Metric
                value={`${summaryPct}%`}
                label="Dias com resumo"
                {...(logs.length === 0 ? { detail: "sem dados" } : {})}
              />
            </div>
          </ExpandingSection>

          <ExpandingSection
            title="Link público"
            icon={<Link2 className="size-4" />}
            summary={publicLinkSummary}
            description="Sua janela para o mundo — agenda, projetos e realizações"
          >
            {publicUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                    {publicUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-faint transition-colors hover:text-primary"
                    onClick={copyPublicUrl}
                    aria-label="Copiar link público"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <Link
                  to="/u/$slug"
                  params={{ slug: publicSlug }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  <ExternalLink className="size-3" /> Ver como visitante
                </Link>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Defina seu nome de link em{" "}
                <Link
                  to="/configuracoes"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Configurações → Link público
                </Link>{" "}
                e compartilhe perfilvivo.com/…
              </p>
            )}
          </ExpandingSection>

          <ExpandingSection
            title="Disponibilidade"
            icon={<CalendarDays className="size-4" />}
            summary={availabilitySummary}
            description="Quando você pode receber reuniões"
          >
            <div className="space-y-4">
              {availableWeekdays.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Você ainda não abriu dias para reuniões. Configure quais dias
                  aceita pedidos em{" "}
                  <Link
                    to="/configuracoes"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Configurações
                  </Link>
                  .
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {availableWeekdays.map((wd) => (
                      <span key={wd} className="status status-open">
                        {WEEKDAY_SHORT[wd % 7]}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="text-[11px] text-faint">Hoje — livres</p>
                      <p className="font-display font-semibold text-primary">
                        {slotsToday.slices.length > 0
                          ? `${slotsToday.slices.length} horário(s)`
                          : slotsToday.free.length > 0
                            ? "janelas abertas"
                            : "nenhum"}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="text-[11px] text-faint">Amanhã — livres</p>
                      <p className="font-display font-semibold text-primary">
                        {slotsTomorrow.slices.length > 0
                          ? `${slotsTomorrow.slices.length} horário(s)`
                          : slotsTomorrow.free.length > 0
                            ? "janelas abertas"
                            : "nenhum"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/configuracoes"
                    className="inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Configurar disponibilidade →
                  </Link>
                </>
              )}
              {pendingMeetings > 0 && (
                <Link
                  to="/agenda"
                  className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                >
                  <Inbox className="size-3.5" />
                  {pendingMeetings} solicitação(ões) de reunião aguardando
                  resposta
                  <ArrowRight className="ml-auto size-3.5" />
                </Link>
              )}
            </div>
          </ExpandingSection>

          <ExpandingSection
            title="Consistência"
            icon={<Activity className="size-4" />}
            summary="Mapa das suas últimas 20 semanas de registro"
            description="Cada célula é um dia registrado"
          >
            <div className="rounded-lg border border-border bg-card p-4">
              <ConsistencyHeatmap />
            </div>
          </ExpandingSection>

          <ExpandingSection
            title="Memento Mori"
            icon={<Hourglass className="size-4" />}
            summary="O valor de cada dia, medido no tempo que resta"
            description="Seus ciclos de vida em blocos de 25 anos"
          >
            <div className="quiet-panel">
              <LifetimeTracker />
            </div>
          </ExpandingSection>

          <ExpandingSection
            title="Gamificação"
            icon={<Sparkles className="size-4" />}
            summary="Nível, XP, streak e conquistas"
            description="Seu progresso vivo, derivado dos seus registros"
          >
            <GamificationPanel />
          </ExpandingSection>

          <ProfileCompleteness />

          <div className="flex items-center gap-2 px-1 pt-3 text-xs text-faint">
            <Clock3 className="size-3.5" />
            <span>Cada registro fortalece a sua história.</span>
          </div>
        </div>
      </div>
    </>
  );
}
