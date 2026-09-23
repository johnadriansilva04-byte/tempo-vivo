import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { DailyLogCard } from "@/components/daily-log-card";
import { FocusCard } from "@/components/focus-card";
import { ProfileHeader } from "@/components/profile-header";
import { Metric, ProgressBar, Section } from "@/components/page-kit";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useProfile } from "@/hooks/use-profile";
import { getMilestones, getProjects } from "@/services/profile-service";

export function DashboardPage() {
  const { profile } = useProfile();
  const { logs } = useDailyLogs();
  const projects = getProjects();
  const milestones = getMilestones();
  const latest = milestones[0];
  const [showAllLogs, setShowAllLogs] = useState(false);

  const openLogs = logs.filter((l) => l.status !== "LOCKED");
  const visibleLogs = (showAllLogs ? logs : openLogs.slice(0, 2)).slice(0, 4);

  return (
    <>
      <ProfileHeader />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-9">
          <Tabs defaultValue="agora">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="agora">Agora</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="metas">Metas da semana</TabsTrigger>
            </TabsList>

            <TabsContent value="agora" className="mt-5">
              <Section title="Agora" detail="O que está recebendo sua energia">
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.slice(0, 2).map((p) => (
                    <Link to="/projetos" key={p.name} className="card-interactive">
                      <div className="flex items-start justify-between">
                        <span className="status status-neutral">{p.status}</span>
                        <ArrowRight className="size-4 text-faint" />
                      </div>
                      <h3 className="mt-5 font-display text-base font-semibold">{p.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {p.description}
                      </p>
                      <div className="mt-5">
                        <ProgressBar value={p.progress} />
                        <p className="mt-2 text-xs text-faint">{p.progress}% concluído</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="agenda" className="mt-5">
              <Section title="Próximos registros" detail="Livro de bordo — dias vivos">
                <div className="space-y-4">
                  {visibleLogs.length === 0 && (
                    <p className="text-sm text-faint">
                      Nenhum registro vivo. Comece o dia de hoje.
                    </p>
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
          <Section title="Em números">
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 border-y border-border py-5">
              <Metric value={String(1248)} label="Dias registrados" />
              <Metric value="18" label="Marcos preservados" />
              <Metric value="7" label="Projetos concluídos" />
              <Metric value="86%" label="Dias com resumo" />
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
                {latest && (
                  <div className="quiet-panel">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-foreground">
                      <Sparkles className="size-3.5" />
                      {latest.category}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{latest.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {latest.description}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-faint">
                      <CheckCircle2 className="size-3.5" />
                      Preservado em {latest.year}
                    </div>
                  </div>
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
