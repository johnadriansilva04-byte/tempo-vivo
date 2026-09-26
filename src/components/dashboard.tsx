import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  FolderKanban,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import { PageHeader, PageSkeleton, ProgressBar } from "@/components/page-kit";
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
        action={
          <Link
            to="/agenda"
            search={{ dia: today }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground"
          >
            Abrir agenda
            <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      <div className="tile-grid">
        <section className="tile-panel tile-panel-wide">
          <h2 className="tile-title">
            <CalendarClock className="size-3.5" />
            Próximo compromisso
          </h2>
          {next ? (
            <Link to="/agenda" search={{ dia: next.date }} className="dash-next">
              <span className="dash-next-time">{timeLabel(next.event.start_time)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {readableText(next.event.title)}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {next.date === today ? "Hoje" : dayLabel(next.date)}
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
        </section>

        {todayEvents.length > 0 && (
          <section className="tile-panel">
            <h2 className="tile-title">
              <Clock3 className="size-3.5" />
              Hoje
              <span className="tile-count">
                {todayEvents.length} {plural(todayEvents.length, "compromisso", "compromissos")}
              </span>
            </h2>
            <ul className="dash-list">
              {todayEvents.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <span className="dash-hour">{timeLabel(event.start_time)}</span>
                  <Link
                    to="/agenda"
                    search={{ dia: today }}
                    className="min-w-0 flex-1 truncate text-sm"
                  >
                    {readableText(event.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="tile-panel">
          <h2 className="tile-title">
            <FolderKanban className="size-3.5" />
            Projeto principal
          </h2>
          {mainProject ? (
            <Link to="/projetos" className="block">
              <div className="flex items-baseline justify-between gap-2">
                <span className="status status-neutral">{mainProject.status}</span>
                <span className="tile-progress">{mainProject.progress}%</span>
              </div>
              <h3 className="mt-2.5 font-display text-sm font-semibold">
                {readableText(mainProject.name)}
              </h3>
              <div className="mt-2">
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
        </section>

        <section className="tile-panel">
          <h2 className="tile-title">
            <Target className="size-3.5" />
            Meta da semana
          </h2>
          {weekFocus.length > 0 ? (
            <ul className="tile-projects">
              {weekFocus.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{readableText(item.title)}</span>
                    <span className="tile-progress">{item.progress_pct}%</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={item.progress_pct} />
                  </div>
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
        </section>

        <section className="tile-panel">
          <h2 className="tile-title">
            <Trophy className="size-3.5" />
            Última realização
          </h2>
          {lastAchievement ? (
            <Link to="/realizacoes" className="flex items-center gap-2.5">
              <span className="tile-check">
                <Check className="size-3" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {readableText(lastAchievement.title)}
                </span>
                <span className="text-xs text-faint">{lastAchievement.year}</span>
              </span>
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
        </section>
      </div>

      <div className="dash-stats mt-4">
        <div className="tile-stat">
          <p className="tile-stat-value">{projects.length}</p>
          <p className="tile-stat-label">{plural(projects.length, "projeto", "projetos")}</p>
        </div>
        <div className="tile-stat">
          <p className="tile-stat-value">{milestones.length}</p>
          <p className="tile-stat-label">{plural(milestones.length, "conquista", "conquistas")}</p>
        </div>
        <div className="tile-stat">
          <p className="tile-stat-value">{events.length}</p>
          <p className="tile-stat-label">{plural(events.length, "evento", "eventos")}</p>
        </div>
      </div>
    </>
  );
}
