import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import { Metric, PageHeader, ProgressBar, Section } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useAgendaEvents } from "@/hooks/use-agenda-events";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { useWeeklyFocus, focusForCurrentWeek } from "@/hooks/use-weekly-focus";
import { dayLabel, nextEventAt, toIso } from "@/lib/calendar";
import { isPlaceholderText } from "@/lib/placeholder";
import { plural } from "@/lib/utils";

/** Resumo rápido: o que fazer, o que está em curso, o que já foi feito. */
export function DashboardPage() {
  const { events } = useAgendaEvents();
  const { projects } = useProjects();
  const { milestones } = useMilestones();
  const { focus } = useWeeklyFocus();

  const today = toIso(new Date());
  const nextEvent = useMemo(() => {
    const now = new Date();
    return nextEventAt(
      events,
      today,
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
  }, [events, today]);
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
            {nextEvent ? (
              <Link to="/agenda" className="card-interactive flex items-center gap-4">
                <span className="icon-tile">
                  <CalendarClock />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {nextEvent.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {nextEvent.event_date === today ? "Hoje" : dayLabel(nextEvent.event_date)} ·{" "}
                    {nextEvent.start_time}
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
                onAction={() => (window.location.href = "/agenda")}
              />
            )}
          </Section>

          <Section title="Projeto principal">
            {mainProject ? (
              <Link to="/projetos" className="card-interactive block">
                <div className="flex items-center justify-between gap-3">
                  <span className="status status-neutral">{mainProject.status}</span>
                  <span className="text-xs font-medium">{mainProject.progress}%</span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{mainProject.name}</h3>
                {mainProject.description.trim() !== "" && (
                  <p className="mt-1 text-sm text-muted-foreground">{mainProject.description}</p>
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
                onAction={() => (window.location.href = "/projetos")}
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
                    <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                    <span className="text-xs font-semibold text-primary">{item.progress_pct}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma meta para esta semana.</p>
            )}
          </Section>

          <Section title="Última realização">
            {lastAchievement ? (
              <div className="card-interactive flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-faint">{lastAchievement.year}</p>
                  <p className="mt-0.5 text-sm font-semibold">{lastAchievement.title}</p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Trophy className="size-5" />}
                title="Nenhuma conquista"
                description="Registre a primeira em Realizações."
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
