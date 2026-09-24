import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FolderKanban,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DailyLogCard } from "@/components/daily-log-card";
import { EmptyState } from "@/components/empty-state";
import { FocusCard } from "@/components/focus-card";
import { ProfileHeader } from "@/components/profile-header";
import { StoryPanel } from "@/components/story-panel";
import { StoryText } from "@/components/story-text";
import { isPlaceholderText } from "@/lib/placeholder";
import { RitualInvite } from "@/components/daily-ritual";
import { Metric, Section } from "@/components/page-kit";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useMilestones } from "@/hooks/use-milestones";
import { useProjects } from "@/hooks/use-projects";
import { openRitual } from "@/store/ritual-store";
import type { RitualPhase } from "@/store/ritual-store";

export function DashboardPage() {
  const { logs } = useDailyLogs();
  const { projects } = useProjects();
  const { milestones } = useMilestones();
  const [showAllLogs, setShowAllLogs] = useState(false);

  // "Última realização" = o marco mais recente que o dono já viveu. Marcos com ano
  // em branco ou no futuro são objetivos, não conquistas, e ficam fora do destaque.
  const thisYear = new Date().getFullYear();
  const latest = useMemo(
    () =>
      milestones
        .filter((m) => {
          if (isPlaceholderText(m.year) || isPlaceholderText(m.title)) return false;
          const year = Number(m.year);
          return Number.isFinite(year) && year <= thisYear;
        })
        .sort((a, b) => Number(b.year) - Number(a.year))[0] ?? null,
    [milestones, thisYear],
  );

  const openLogs = logs.filter((l) => l.status !== "LOCKED");
  const visibleLogs = (showAllLogs ? logs : openLogs.slice(0, 2)).slice(0, 4);

  // Métricas derivadas — zero quando o app começa vazio.
  const daysWithSummary = logs.filter((l) => l.summary_text.trim() !== "").length;
  const summaryPct = logs.length === 0 ? 0 : Math.round((daysWithSummary / logs.length) * 100);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.log_date === todayIso);

  return (
    <>
      <ProfileHeader />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-9">
          {/* O convite do dia vem antes de tudo: é o gesto que mantém a história viva. */}
          <div className="reveal">
            <RitualInvite log={todayLog} onStart={(phase: RitualPhase) => openRitual(phase)} />
          </div>

          <Tabs defaultValue="agora">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="agora">Agora</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="metas">Metas da semana</TabsTrigger>
            </TabsList>

            <TabsContent value="agora" className="mt-5">
              <Section title="Agora" detail="O que está recebendo sua energia">
                {projects.length === 0 ? (
                  <EmptyState
                    icon={<FolderKanban className="size-5" />}
                    title="Nenhum projeto ainda"
                    description="Crie seu primeiro projeto em Projetos e acompanhe o avanço aqui."
                    actionLabel="Ir para Projetos"
                    onAction={() => (window.location.href = "/projetos")}
                  />
                ) : (
                  <div className="reveal grid gap-3 sm:grid-cols-2">
                    {projects.slice(0, 2).map((p) => (
                      <Link to="/projetos" key={p.name} className="card-interactive">
                        <div className="flex items-start justify-between">
                          <span className="status status-neutral">{p.status}</span>
                          <ArrowRight className="size-4 text-faint" />
                        </div>
                        <h3 className="mt-5 font-display text-base font-semibold">
                          <StoryText text={p.name} />
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          <StoryText text={p.description} />
                        </p>
                        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-faint">{p.progress}% concluído</p>
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            </TabsContent>

            <TabsContent value="agenda" className="mt-5">
              <Section title="Próximos registros" detail="Livro de bordo — dias vivos">
                <div className="space-y-4">
                  {visibleLogs.length === 0 && (
                    <EmptyState
                      icon={<Inbox className="size-5" />}
                      title="Nenhum registro vivo"
                      description="O dia de hoje é o próximo. Abra o registro e descreva sua intenção."
                      actionLabel="Abrir Agenda"
                      onAction={() => (window.location.href = "/agenda")}
                    />
                  )}
                  {visibleLogs.map((log) => (
                    <DailyLogCard key={log.id} log={log} />
                  ))}
                </div>
                {!showAllLogs && logs.length > visibleLogs.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 -ml-3 text-xs text-muted-foreground"
                    onClick={() => setShowAllLogs(true)}
                  >
                    Ver histórico completo <ChevronDown className="size-3.5" />
                  </Button>
                )}
              </Section>
            </TabsContent>

            <TabsContent value="metas" className="mt-5">
              <Section title="Metas da semana" detail="Progresso comprometido, não desejado">
                <FocusCard />
              </Section>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-9">
          <StoryPanel onStartRitual={() => openRitual(null)} />

          <Section title="Em números">
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 border-y border-border py-5">
              <Metric value={String(logs.length)} label="Dias registrados" />
              <Metric value={String(milestones.length)} label="Marcos preservados" />
              <Metric
                value={String(projects.filter((p) => p.status === "Concluído").length)}
                label="Projetos concluídos"
              />{" "}
              <Metric
                {...(logs.length === 0
                  ? { detail: "sem dados", value: `${summaryPct}%`, label: "Dias com resumo" }
                  : { value: `${summaryPct}%`, label: "Dias com resumo" })}
              />
            </div>
          </Section>

          <Collapsible defaultOpen className="group">
            <Section title="Última realização" className="">
              {" "}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 gap-1 text-xs text-muted-foreground"
                >
                  <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                  Detalhes
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {latest ? (
                  <div className="quiet-panel ink-settle">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground">
                      <Sparkles className="size-3.5" />
                      {latest.category}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">
                      <StoryText text={latest.title} />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      <StoryText text={latest.description} />
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-faint">
                      <CheckCircle2 className="size-3.5" />
                      {isPlaceholderText(latest.year)
                        ? "Marco preservado"
                        : `Preservado em ${latest.year}`}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Sparkles className="size-5" />}
                    title="Nenhum marco ainda"
                    description="Seu primeiro marco vai brilhar aqui. Registre uma realização em Realizações."
                  />
                )}
              </CollapsibleContent>
            </Section>
          </Collapsible>

          <div className="flex items-center gap-2 text-xs text-faint">
            <Clock3 className="size-3.5" />
            <span>Cada registro fortalece a sua história.</span>
          </div>
        </div>
      </div>
    </>
  );
}
