import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import { Metric, PageHeader, PageSkeleton, ProgressBar, Section } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useAgendaEvents } from "@/hooks/use-agenda-events";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { useWeeklyFocus, focusForCurrentWeek } from "@/hooks/use-weekly-focus";
import {
  byStartTime,
  dayLabel,
  nextOccurrenceAt,
  occursOn,
  timeLabel,
  toIso,
} from "@/lib/calendar";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import { plural } from "@/lib/utils";

/** Resumo rápido: o que fazer, o que está em curso, o que já foi feito. */
export function DashboardPage() {
  const { events, isLoading: loadingEvents } = useAgendaEvents();
  const { projects, isLoading: loadingProjects } = useProjects();
  const { milestones, isLoading: loadingMilestones } = useMilestones();
  const { focus, isLoading: loadingFocus } = useWeeklyFocus();

  const today = toIso(new Date());
  const next = useMemo(() => {
    const now = new Date();
    return nextOccurrenceAt(
      events,
      today,
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
  }, [events, today]);
  const todayEvents = useMemo(
    () => byStartTime(events.filter((event) => occursOn(event, today))),
    [events, today],
  );
  const weekFocus = focusForCurrentWeek(focus);
  const mainProject = useMemo(
    () => [...projects].sort((a, b) => b.progress - a.progress)[0] ?? null,
    [projects],
  );
  const thisYear = new Date().getFullYear();
  const lastAchievement = useMemo(
    () =>
      milestones
        .filter((m) => {
          if (isPlaceholderText(m.title)) return false;
          const year = Number(m.year);
          return Number.isFinite(year) && year <= thisYear;
        })
        .sort((a, b) => Number(b.year) - Number(a.year))[0] ?? null,
    [milestones, thisYear],
  );

  const loading = loadingEvents || loadingProjects || loadingMilestones || loadingFocus;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Hoje"
          detail={new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        />
        <PageSkeleton lines={0} rows={3} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Hoje"
        detail={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Section title="Próximo compromisso">
            {next ? (
              <Link
                to="/agenda"
                search={{ dia: next.date }}
                className="card-interactive flex items-center gap-4"
              >
                <span className="icon-tile">
                  <CalendarClock />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {readableText(next.event.title)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {next.date === today ? "Hoje" : dayLabel(next.date)} ·{" "}
                    {timeLabel(next.event.start_time)}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-faint" />
              </Link>
            ) : (
              <EmptyState
                icon={<CalendarClock className="size-5" />}
                title="Sem compromissos"
                description="Nada agendado. Adicione um evento na Agenda."
                actionLabel="Abrir Agenda"
                to="/agenda"
              />
            )}
          </Section>

          {todayEvents.length > 0 && (
            <Section
              title="Agenda de hoje"
              detail={`${todayEvents.length} ${plural(todayEvents.length, "compromisso", "compromissos")}`}
            >
              <ul className="space-y-2">
                {todayEvents.slice(0, 5).map((event) => (
                  <li key={event.id}>
                    <Link
                      to="/agenda"
                      search={{ dia: today }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40"
                    >
                      <span className="inline-flex w-12 shrink-0 items-center gap-1 text-xs font-semibold text-accent-foreground">
                        <Clock3 className="size-3" />
                        {timeLabel(event.start_time)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {readableText(event.title)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Projeto principal">
            {mainProject ? (
              <Link to="/projetos" className="card-interactive block">
                <div className="flex items-center justify-between gap-3">
                  <span className="status status-neutral">{mainProject.status}</span>
                  <span className="text-xs font-medium">{mainProject.progress}%</span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">
                  {readableText(mainProject.name)}
                </h3>
                {mainProject.description.trim() !== "" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {readableText(mainProject.description)}
                  </p>
                )}
                <div className="mt-4">
                  <ProgressBar value={mainProject.progress} />
                </div>
              </Link>
            ) : (
              <EmptyState
                icon={<FolderKanban className="size-5" />}
                title="Nenhum projeto"
                description="Crie o primeiro para acompanhar o avanço."
                actionLabel="Ir para Projetos"
                to="/projetos"
              />
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Meta da semana">
            {weekFocus.length > 0 ? (
              <ul className="space-y-2">
                {weekFocus.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <Target className="size-4 shrink-0 text-accent-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {readableText(item.title)}
                    </span>
                    <span className="text-xs font-semibold text-primary">{item.progress_pct}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Target className="size-5" />}
                title="Nenhuma meta esta semana"
                description="Defina o que quer cumprir nos próximos dias."
                actionLabel="Planejar a semana"
                to="/planejamento"
              />
            )}
          </Section>

          <Section title="Última realização">
            {lastAchievement ? (
              <Link to="/realizacoes" className="card-interactive flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-faint">{lastAchievement.year}</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {readableText(lastAchievement.title)}
                  </p>
                </div>
              </Link>
            ) : (
              <EmptyState
                icon={<Trophy className="size-5" />}
                title="Nenhuma conquista"
                description="Registre a primeira em Realizações."
                actionLabel="Abrir Realizações"
                to="/realizacoes"
              />
            )}
          </Section>

          <Section title="Resumo">
            <div className="grid grid-cols-3 gap-3">
              <Metric
                value={String(projects.length)}
                label={plural(projects.length, "projeto", "projetos")}
              />
              <Metric
                value={String(milestones.length)}
                label={plural(milestones.length, "conquista", "conquistas")}
              />
              <Metric
                value={String(events.length)}
                label={plural(events.length, "evento", "eventos")}
              />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
