import { useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Download,
  FileText,
  Flag,
  FolderKanban,
  Globe2,
  GraduationCap,
  Heart,
  Hourglass,
  MapPin,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Metric,
  PageHeader,
  ProgressBar,
  Section,
} from "@/components/page-kit";
import type { DailyLog, Project } from "@/types/profile";
import { DailyLogCard } from "@/components/daily-log-card";
import { EmptyState } from "@/components/empty-state";
import { FocusCard } from "@/components/focus-card";
import { DayAgenda } from "@/components/schedule-kit";
import { AgendaPlanner } from "@/components/agenda-planner";
import { MeetingRequestsPanel } from "@/components/meeting-requests-panel";
import { useTodayTomorrow } from "@/hooks/use-schedule";
import { useFamilyMembers } from "@/hooks/use-family";
import { FAMILY_RELATION_LABELS } from "@/lib/validators";
import { useDailyLogs, useOpenTodayLog } from "@/hooks/use-daily-logs";
import { useWeeklyFocus } from "@/hooks/use-weekly-focus";
import { useProfile } from "@/hooks/use-profile";
import { usePrologue, useSetPrologue } from "@/hooks/use-prologue";
import {
  useCareerChapters,
  useCreateCareerChapter,
} from "@/hooks/use-career-chapters";
import { useMilestones, useCreateMilestone } from "@/hooks/use-milestones";
import {
  useProjects,
  useUpsertProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useCreateFocus } from "@/hooks/use-weekly-focus";
import {
  useCreateCapsule,
  useOpenCapsule,
  useTimeCapsules,
} from "@/hooks/use-time-capsules";

// ---------------------------------------------------------------- AgendaPage

const AGENDA_VIEWS = ["Dia", "Semana", "Mês", "Ano"] as const;

type AgendaFilter = (typeof AGENDA_VIEWS)[number];

function filterLogsByView(logs: DailyLog[], view: AgendaFilter): DailyLog[] {
  if (view === "Dia") return logs;
  const now = new Date();
  const cutoff = new Date(now);
  if (view === "Semana") cutoff.setDate(now.getDate() - 7);
  else if (view === "Mês") cutoff.setMonth(now.getMonth() - 1);
  else cutoff.setFullYear(now.getFullYear() - 1);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return logs.filter((l) => l.log_date >= cutoffIso);
}

function downloadPrologueReport(prologue: string) {
  const lines = [
    "RELATÓRIO DOS ANOS ANTERIORES — Perfil Vivo",
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    "",
    prologue.trim() === "" ? "(O prólogo ainda não foi escrito.)" : prologue,
    "",
    "—",
    "Daqui em diante, cada dia constrói a história.",
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-anteriores-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AgendaPage() {
  const { logs, isLoading } = useDailyLogs();
  const { profile } = useProfile();
  const { prologue, isLoading: prologueLoading } = usePrologue();
  const [prologueDraft, setPrologueDraft] = useState<string | null>(null);
  const [savingPrologue, setSavingPrologue] = useState(false);
  const [view, setView] = useState<AgendaFilter>("Dia");
  const setPrologue = useSetPrologue();
  const openToday = useOpenTodayLog();
  const {
    today,
    tomorrow,
    occurrencesToday,
    occurrencesTomorrow,
    isLoading: scheduleLoading,
  } = useTodayTomorrow();

  // Quando o draft é null, usamos o valor reativo do banco; assim o campo espelha
  // o prólogo salvo e a atualização via mutation reflete sem reload.

  const visibleLogs = filterLogsByView(logs, view);

  return (
    <>
      <PageHeader
        eyebrow="O núcleo do sistema"
        title="Agenda"
        description="Rotina recorrente com exceções pontuais, disponibilidade e o histórico permanente — hoje e amanhã primeiro."
        action={
          <div className="segmented">
            {AGENDA_VIEWS.map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      {/* HOJE / AMANHÃ — a primeira experiência com a rotina real */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DayAgenda
          title="Hoje"
          dateIso={today}
          occurrences={occurrencesToday}
          emptyLabel={
            scheduleLoading ? "Carregando…" : "Dia livre — nenhum compromisso."
          }
        />
        <DayAgenda
          title="Amanhã"
          dateIso={tomorrow}
          occurrences={occurrencesTomorrow}
          emptyLabel={
            scheduleLoading ? "Carregando…" : "Dia livre — nenhum compromisso."
          }
        />
      </div>

      <div className="mt-10">
        <AgendaPlanner />
      </div>

      <div className="mt-10">
        <MeetingRequestsPanel />
      </div>

      <div className="timeline-line">
        <span>Histórico permanente — o passado registrado</span>
      </div>

      {/* Prólogo — vazio até o dono escrever. Nada inventado. */}
      <section id="prologue-editor" className="prologue">
        <div className="prologue-icon">
          <FileText />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status status-archive">Início</span>
            <span className="text-xs text-faint">
              Documento de origem • seu relato
            </span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">
            Relatório dos anos anteriores
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => downloadPrologueReport(prologue)}
            title="Baixar relatório"
          >
            <Download className="size-3.5" /> Baixar relatório
          </Button>
          {profile && profile.name.trim() === "" ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Defina seu nome em{" "}
              <a
                href="/configuracoes"
                className="font-medium text-primary underline underline-offset-2"
              >
                Configurações
              </a>{" "}
              e volte aqui para escrever o prólogo — só o seu relato será
              exibido.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escreva o resumo honesto dos anos que precedem o primeiro dia
                neste app. Ele ficará afixado no topo da sua agenda.
              </p>
              {prologueLoading ? (
                <div className="mt-3 h-24 animate-pulse rounded-md border border-border bg-muted" />
              ) : (
                <>
                  <Textarea
                    className="mt-3 min-h-24 text-sm"
                    placeholder="Ex.: Nasci em… Cresci… Em … mudei para…, trabalhei…, recomecei… Hoje começo este registro para que os próximos dias deixem sentido."
                    value={prologueDraft ?? prologue}
                    onChange={(e) => setPrologueDraft(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={savingPrologue}
                    onClick={() => {
                      setSavingPrologue(true);
                      setPrologue.mutate(prologueDraft ?? prologue, {
                        onSettled: () => setSavingPrologue(false),
                      });
                    }}
                  >
                    {savingPrologue ? "Salvando…" : "Salvar prólogo"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <div className="timeline-line">
        <span>Daqui em diante, cada dia constrói a história</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Sua agenda começa hoje"
          description="Ainda não há registros. Abra o dia de hoje, descreva o que você pretende fazer e, à noite, registre o que de fato aconteceu."
          actionLabel="Abrir o registro de hoje"
          onAction={() => openToday.openToday()}
        />
      ) : visibleLogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Nada neste período"
          description={`Não há registros nos últimos ${view === "Semana" ? "7 dias" : view === "Mês" ? "30 dias" : "365 dias"}. Tente outro filtro.`}
        />
      ) : (
        <div className="space-y-5">
          {visibleLogs.map((log) => (
            <DailyLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Currículo Vivo

export function ResumePage() {
  const { chapters, isLoading } = useCareerChapters();
  const create = useCreateCareerChapter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    period: "",
    document_type: "EXPERIENCE",
    content: "",
  });

  const byType = (t: string) => chapters.filter((c) => c.document_type === t);
  const experiences = byType("EXPERIENCE");
  const education = byType("EDUCATION");
  const productions = byType("PRODUCTION");
  const certificates = byType("CERTIFICATE");

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft as Parameters<typeof create.mutate>[0], {
      onSuccess: () => {
        setDraft({
          title: "",
          period: "",
          document_type: "EXPERIENCE",
          content: "",
        });
        setOpen(false);
      },
    });
  };

  if (isLoading)
    return (
      <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
    );

  return (
    <>
      <PageHeader
        eyebrow="Trajetória profissional"
        title="Currículo vivo"
        description="Formação e experiências apresentadas como partes de uma história humana, prontas para compartilhar."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Adicionar capítulo"}
          </Button>
        }
      />

      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Cargo, formação ou produção"
              />
            </Field>
            <Field label="Período">
              <Input
                value={draft.period}
                onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                placeholder="Ex.: 2022 — hoje"
              />
            </Field>
            <Field label="Tipo">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.document_type}
                onChange={(e) =>
                  setDraft({ ...draft, document_type: e.target.value })
                }
              >
                <option value="EXPERIENCE">Experiência</option>
                <option value="EDUCATION">Formação</option>
                <option value="PRODUCTION">Produção</option>
                <option value="CERTIFICATE">Certificado</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Conteúdo">
                <Textarea
                  value={draft.content}
                  onChange={(e) =>
                    setDraft({ ...draft, content: e.target.value })
                  }
                  placeholder="Breve descrição"
                  rows={2}
                />
              </Field>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={submit}
            disabled={!draft.title.trim() || create.isPending}
          >
            Salvar capítulo
          </Button>
        </div>
      )}

      {chapters.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="size-5" />}
          title="Seu currículo vivo está vazio"
          description="Adicione experiências, formações e produções acima. Tudo fica salvo e aparece aqui — nada é inventado."
        />
      ) : (
        <div className="grid gap-9 lg:grid-cols-[1fr_280px]">
          <div className="space-y-9">
            {experiences.length > 0 && (
              <TimelineSection
                icon={BriefcaseBusiness}
                title="Experiência"
                rows={experiences.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {education.length > 0 && (
              <TimelineSection
                icon={GraduationCap}
                title="Formação"
                rows={education.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {productions.length > 0 && (
              <TimelineSection
                icon={FileText}
                title="Produções"
                rows={productions.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {certificates.length > 0 && (
              <TimelineSection
                icon={Sparkles}
                title="Certificados"
                rows={certificates.map((c) => [c.period, c.title, c.content])}
              />
            )}
          </div>
          <aside className="space-y-7">
            <InfoList
              title="Resumo"
              items={[
                `${chapters.length} ${chapters.length === 1 ? "capítulo" : "capítulos"} registrados`,
                `${experiences.length} ${experiences.length === 1 ? "experiência" : "experiências"}`,
                `${education.length} ${education.length === 1 ? "formação" : "formações"}`,
              ]}
            />
          </aside>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </Label>
      {children}
    </div>
  );
}

// --------------------------------------------------------------- PlanningPage

export function PlanningPage() {
  const [input, setInput] = useState({ title: "", description: "" });
  const create = useCreateFocus();
  const submit = () => {
    if (!input.title.trim()) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      (Math.floor((now.getTime() - start.getTime()) / 86400000) +
        start.getDay() +
        1) /
        7,
    );
    create.mutate(
      {
        title: input.title.trim(),
        description: input.description.trim(),
        week_number: week,
        year: now.getFullYear(),
      },
      { onSuccess: () => setInput({ title: "", description: "" }) },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Direção consciente"
        title="Planejamento"
        description="Objetivos que conectam intenção, ações e o futuro que está sendo construído."
      />
      <Section
        title="Metas da semana"
        detail="Progresso comprometido, não desejado"
      >
        <FocusCard />
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Nova meta
            </Label>
            <Input
              value={input.title}
              onChange={(e) => setInput({ ...input, title: e.target.value })}
              placeholder="Título"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Descrição
            </Label>
            <Input
              value={input.description}
              onChange={(e) =>
                setInput({ ...input, description: e.target.value })
              }
              placeholder="Opcional"
            />
          </div>
          <Button
            size="sm"
            onClick={submit}
            disabled={!input.title.trim() || create.isPending}
          >
            Adicionar
          </Button>
        </div>
      </Section>
      <YearOverview />
    </>
  );
}

function YearOverview() {
  const { focus } = useWeeklyFocus();
  const { projects } = useProjects();
  const { milestones } = useMilestones();
  const { logs } = useDailyLogs();
  const year = new Date().getFullYear();

  const yearGoals = focus.filter((f) => f.year === year);
  const yearProjects = projects.filter(
    (p) => p.status === "Em andamento" || p.status === "Concluído",
  );
  const yearMilestones = milestones.filter((m) => m.year === String(year));
  const yearLogs = logs.filter((l) => l.log_date.startsWith(String(year)));
  const done = yearGoals.filter((f) => f.progress_pct === 100).length;
  const avgProgress =
    yearGoals.length === 0
      ? 0
      : Math.round(
          yearGoals.reduce((acc, f) => acc + f.progress_pct, 0) /
            yearGoals.length,
        );

  return (
    <Section
      title={`Panorama de ${year}`}
      detail="O que de fato está acontecendo neste ano — sem decoração"
      className="mt-10"
    >
      {yearGoals.length === 0 &&
      yearProjects.length === 0 &&
      yearMilestones.length === 0 &&
      yearLogs.length === 0 ? (
        <EmptyState
          icon={<Flag className="size-5" />}
          title={`Nada registrado em ${year} ainda`}
          description="Metas desta semana, projetos, marcos e registros diários deste ano aparecem aqui automaticamente."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={String(yearGoals.length)}
            label="Metas criadas no ano"
          />
          <Metric value={String(done)} label="Metas concluídas (100%)" />
          <Metric value={`${avgProgress}%`} label="Progresso médio das metas" />
          <Metric
            value={String(yearLogs.length)}
            label="Dias registrados no ano"
          />
          <Metric
            value={String(
              yearProjects.filter((p) => p.status === "Em andamento").length,
            )}
            label="Projetos em andamento"
          />
          <Metric
            value={String(
              yearProjects.filter((p) => p.status === "Concluído").length,
            )}
            label="Projetos concluídos"
          />
          <Metric
            value={String(yearMilestones.length)}
            label="Marcos deste ano"
          />
          <Metric
            value={String(
              yearLogs.filter((l) => l.summary_text.trim() !== "").length,
            )}
            label="Dias com resumo escrito"
          />
        </div>
      )}
    </Section>
  );
}

// ------------------------------------------------------------ AchievementsPage

export function AchievementsPage() {
  const { milestones, isLoading } = useMilestones();
  const create = useCreateMilestone();
  const [draft, setDraft] = useState({
    year: String(new Date().getFullYear()),
    title: "",
    description: "",
    category: "Vida",
  });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft, {
      onSuccess: () => setDraft({ ...draft, title: "", description: "" }),
    });
  };

  if (isLoading)
    return (
      <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
    );

  return (
    <>
      <PageHeader
        eyebrow="Marcos preservados"
        title="Realizações"
        description="Uma linha do tempo do que mudou sua história — grandes conquistas e viradas silenciosas."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Registrar marco"}
          </Button>
        }
      />
      {open && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <Field label="Ano">
            <Input
              className="w-24"
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </Field>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Título
            </Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="O que aconteceu"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Categoria
            </Label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Vida, Pesquisa…"
            />
          </div>
          <div className="flex-[2] space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Descrição
            </Label>
            <Input
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Como isso mudou sua história"
            />
          </div>
          <Button
            size="sm"
            onClick={submit}
            disabled={!draft.title.trim() || create.isPending}
          >
            Salvar
          </Button>
        </div>
      )}
      {milestones.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Nenhum marco preservado"
          description="Registre o primeiro: uma conquista, virada ou aprendizado do seu percurso."
        />
      ) : (
        <div className="achievement-list">
          {milestones.map((m) => (
            <article key={m.title}>
              <div className="achievement-year">{m.year}</div>
              <div className="achievement-dot" />
              <div className="pb-10">
                <span className="status status-neutral">{m.category}</span>
                <h2 className="mt-3 font-display text-xl font-semibold">
                  {m.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {m.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------------- ProjectsPage

export function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const upsert = useUpsertProject();
  const remove = useDeleteProject();
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    objective: "",
    status: "Planejado" as Project["status"],
    period: "",
    activities: "",
    results: "",
    links: "",
  });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!draft.name.trim()) return;
    upsert.mutate(
      { ...draft, name: draft.name.trim(), progress: 0 },
      {
        onSuccess: () =>
          setDraft({
            name: "",
            description: "",
            objective: "",
            status: "Planejado",
            period: "",
            activities: "",
            results: "",
            links: "",
          }),
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Falha ao salvar projeto.",
          ),
      },
    );
  };

  if (isLoading)
    return (
      <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
    );

  return (
    <>
      <PageHeader
        eyebrow="Trabalho em movimento"
        title="Projetos"
        description="Iniciativas que conectam curiosidade, propósito e impacto ao longo do tempo."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Novo projeto"}
          </Button>
        }
      />
      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nome do projeto"
              />
            </Field>
            <Field label="Status">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as Project["status"],
                  })
                }
              >
                <option value="Planejado">Planejado</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Pesquisa">Pesquisa</option>
                <option value="Concluído">Concluído</option>
              </select>
            </Field>
            <Field label="Período">
              <Input
                value={draft.period}
                onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                placeholder="Ex.: 2024 — hoje"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descrição">
                <Input
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  placeholder="Em poucas palavras"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Objetivo">
                <Input
                  value={draft.objective}
                  onChange={(e) =>
                    setDraft({ ...draft, objective: e.target.value })
                  }
                  placeholder="O que você quer alcançar"
                />
              </Field>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={submit}
            disabled={!draft.name.trim() || upsert.isPending}
          >
            Salvar projeto
          </Button>
        </div>
      )}
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-5" />}
          title="Nada aqui ainda"
          description="Seus projetos aparecerão aqui. Crie um acima para começar — tudo fica salvo."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard
              key={p.name}
              project={p}
              onUpsert={upsert.mutate}
              onRemove={remove.mutate}
            />
          ))}
        </div>
      )}
    </>
  );
}

const PROJECT_STATUSES: Project["status"][] = [
  "Planejado",
  "Em andamento",
  "Pesquisa",
  "Concluído",
];

type UpsertOpts = { onSuccess?: () => void; onError?: (e: unknown) => void };

function ProjectCard({
  project,
  onUpsert,
  onRemove,
}: {
  project: Project;
  onUpsert: (p: Project, opts?: UpsertOpts) => void;
  onRemove: (name: string, opts?: UpsertOpts) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(project.progress);
  const [editDraft, setEditDraft] = useState({
    period: project.period ?? "",
    activities: project.activities ?? "",
    results: project.results ?? "",
    links: project.links ?? "",
  });

  const lines = (text: string) => (text ?? "").split("\n").filter(Boolean);
  const activityLines = lines(project.activities);
  const resultLines = lines(project.results);
  const linkLines = lines(project.links).filter((l) => /^https?:\/\//.test(l));

  return (
    <article className="project-card">
      <div className="flex justify-between">
        <span className="status status-neutral">{project.status}</span>
        <span className="text-xs font-medium">{progress}%</span>
      </div>
      <h2 className="mt-6 font-display text-xl font-semibold">
        {project.name}
      </h2>
      {project.period && (
        <p className="mt-1 text-xs text-faint">{project.period}</p>
      )}
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {project.description}
      </p>
      <p className="mt-5 text-xs text-faint">Objetivo</p>
      <p className="mt-1 text-sm">{project.objective}</p>
      {(activityLines.length > 0 || resultLines.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {activityLines.length > 0 && (
            <div>
              <p className="text-xs text-faint">Atividades</p>
              <ul className="mt-1.5 space-y-1">
                {activityLines.map((a) => (
                  <li
                    key={a}
                    className="flex gap-2 text-xs leading-5 text-muted-foreground"
                  >
                    <span className="text-accent-foreground">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resultLines.length > 0 && (
            <div>
              <p className="text-xs text-faint">Resultados</p>
              <ul className="mt-1.5 space-y-1">
                {resultLines.map((r) => (
                  <li
                    key={r}
                    className="flex gap-2 text-xs leading-5 text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {linkLines.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {" "}
          {linkLines.map((l) => (
            <a
              key={l}
              href={l}
              target="_blank"
              rel="noreferrer noopener"
              className="status status-open"
            >
              <Globe2 className="size-3" />
              {(() => {
                try {
                  return new URL(l).hostname.replace(/^www\./, "");
                } catch {
                  return l.slice(0, 40);
                }
              })()}
            </a>
          ))}
        </div>
      )}
      <div className="mt-6">
        <ProgressBar value={progress} />
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 rounded-md border border-border bg-background/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={project.status}
                onChange={(e) => {
                  const status = e.target.value as Project["status"];
                  onUpsert(
                    { ...project, status },
                    {
                      onSuccess: () => {
                        setEditing(false);
                        toast.success("Status atualizado.");
                      },
                      onError: (e2) =>
                        toast.error(
                          e2 instanceof Error
                            ? e2.message
                            : "Falha ao atualizar.",
                        ),
                    },
                  );
                }}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Progresso">
              <Input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) =>
                  setProgress(
                    Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  )
                }
              />
            </Field>
            <Field label="Período">
              <Input
                value={editDraft.period}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, period: e.target.value })
                }
                placeholder="Ex.: 2024 — hoje"
              />
            </Field>
          </div>
          <div className="grid gap-3">
            <Field label="Atividades (uma por linha)">
              <Textarea
                rows={3}
                value={editDraft.activities}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, activities: e.target.value })
                }
                placeholder="Pesquisa de campo\nAnálise de dados\nEscrita do relatório"
              />
            </Field>
            <Field label="Resultados (um por linha)">
              <Textarea
                rows={2}
                value={editDraft.results}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, results: e.target.value })
                }
                placeholder="Artigo publicado\nDataset aberto"
              />
            </Field>
            <Field label="Links (uma URL por linha)">
              <Textarea
                rows={2}
                value={editDraft.links}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, links: e.target.value })
                }
                placeholder="https://…"
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onUpsert(
                  {
                    ...project,
                    ...editDraft,
                    progress,
                    status: project.status,
                  },
                  {
                    onSuccess: () => {
                      setEditing(false);
                      toast.success("Projeto atualizado.");
                    },
                    onError: (e2) =>
                      toast.error(
                        e2 instanceof Error
                          ? e2.message
                          : "Falha ao atualizar.",
                      ),
                  },
                );
              }}
            >
              Salvar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setProgress(project.progress);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (
                !window.confirm(
                  `Excluir o projeto “${project.name}”? Esta ação não pode ser desfeita.`,
                )
              )
                return;
              onRemove(project.name, {
                onSuccess: () => toast.success("Projeto excluído."),
                onError: (e2) =>
                  toast.error(
                    e2 instanceof Error ? e2.message : "Falha ao excluir.",
                  ),
              });
            }}
          >
            Excluir
          </Button>
        </div>
      )}
    </article>
  );
}

export function AboutPage() {
  const { profile } = useProfile();
  const { chapters } = useCareerChapters();
  const { milestones } = useMilestones();
  const { members: family } = useFamilyMembers();
  const isBlank = !profile || profile.name.trim() === "";

  return (
    <>
      <PageHeader
        eyebrow="Quem sou"
        title={isBlank ? "Sobre" : `Sobre ${profile.name.split(" ")[0]}`}
        description="A pessoa por trás dos registros, seus vínculos e o sentido que atravessa sua trajetória."
      />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {isBlank ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Complete seu perfil"
              description="Sua apresentação aparecerá aqui quando você preencher suas informações."
              actionLabel="Abrir Configurações"
              onAction={() => (window.location.href = "/configuracoes")}
            />
          ) : (
            <>
              <p className="font-display text-2xl leading-relaxed text-foreground">
                {profile.bio ||
                  "Sua bio aparecerá aqui — escreva-a em Configurações."}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <SmallFact
                  icon={MapPin}
                  label="Vive em"
                  value={profile.location || "—"}
                />
                <SmallFact
                  icon={Globe2}
                  label="Nasceu em"
                  value={
                    profile.birth_date
                      ? new Date(
                          `${profile.birth_date}T00:00:00`,
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <SmallFact
                  icon={BriefcaseBusiness}
                  label="O que faz"
                  value={profile.role || "—"}
                />
                <SmallFact
                  icon={Sparkles}
                  label="Capítulos na trajetória"
                  value={String(chapters.length)}
                />
              </div>
              {milestones.length > 0 && (
                <div className="mt-8 border-t border-border pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                    Marcos mais recentes
                  </p>
                  <ul className="mt-3 space-y-2">
                    {milestones.slice(0, 3).map((m) => (
                      <li
                        key={m.title}
                        className="text-sm text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {m.year}
                        </span>{" "}
                        · {m.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        <div className="family-panel">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-accent-foreground" />
            <h2 className="font-display text-lg font-semibold">
              Família conectada
            </h2>
          </div>
          {family.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Conecte sua família em{" "}
              <a
                href="/familia"
                className="font-medium text-primary underline underline-offset-2"
              >
                Família
              </a>{" "}
              — adicione pelo número de celular e construa a continuidade
              digital de quem faz parte da sua história.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {family.slice(0, 8).map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {f.display_name}
                  </span>
                  <span className="status status-neutral">
                    {FAMILY_RELATION_LABELS[f.relation]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <a
            href="/familia"
            className="mt-4 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Gerenciar família →
          </a>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-faint">
            Cada relação é confirmada entre contas — nada é inferido ou
            inventado. O que aparece aqui depende da privacidade que cada um
            definiu.
          </p>
        </div>
      </div>
    </>
  );
}

export function GamesPage() {
  const { capsules, isLoading } = useTimeCapsules();
  const create = useCreateCapsule();
  const openCapsule = useOpenCapsule();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    unlock_at: defaultDate,
  });

  const sealed = capsules.filter((c) => c.unlock_at > today && !c.opened_at);
  const ready = capsules.filter((c) => c.unlock_at <= today || c.opened_at);

  const submit = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    create.mutate(
      {
        title: draft.title.trim(),
        content: draft.content.trim(),
        unlock_at: draft.unlock_at,
      },
      {
        onSuccess: () => {
          setDraft({ title: "", content: "", unlock_at: defaultDate });
          setOpen(false);
          toast.success(
            "Cápsula selada — ela abre em " + draft.unlock_at + ".",
          );
        },
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Não foi possível selar.",
          ),
      },
    );
  };

  const daysUntil = (iso: string) => {
    const ms =
      new Date(`${iso}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  };

  return (
    <>
      <PageHeader
        eyebrow="Exploração & futuro"
        title="Jogos"
        description="A primeira experiência está viva: Cápsulas do Tempo — cartas para o seu eu futuro, seladas até a data que você escolher."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Nova cápsula"}
          </Button>
        }
      />

      {open && (
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Field label="Título da cápsula">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Ex.: Para quando eu completar 40"
              />
            </Field>
            <Field label="Abre em">
              <Input
                type="date"
                min={today}
                value={draft.unlock_at}
                onChange={(e) =>
                  setDraft({ ...draft, unlock_at: e.target.value })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Sua carta">
                <Textarea
                  rows={5}
                  value={draft.content}
                  onChange={(e) =>
                    setDraft({ ...draft, content: e.target.value })
                  }
                  placeholder="Escreva para quem você vai ser. O que você espera? O que quer lembrar? Depois de selar, o conteúdo fica imutável — nem você pode editá-lo."
                />
              </Field>
            </div>
          </div>
          {create.error ? (
            <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {create.error instanceof Error
                ? create.error.message
                : String(create.error)}
            </p>
          ) : null}
          <Button
            size="sm"
            className="mt-3"
            onClick={submit}
            disabled={
              !draft.title.trim() ||
              !draft.content.trim() ||
              !draft.unlock_at ||
              draft.unlock_at <= today ||
              create.isPending
            }
          >
            {create.isPending ? "Selando…" : "Selar cápsula"}
          </Button>
          <p className="mt-2 text-[11px] text-faint">
            A integridade é garantida pelo banco: após selada, título, conteúdo
            e data não mudam.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg border border-border bg-card" />
      ) : capsules.length === 0 ? (
        <div className="games-stage">
          <div className="game-orbit">
            <Hourglass />
          </div>
          <span className="status status-open">
            <Sparkles className="size-3" />
            Experiência ativa
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">
            Cápsulas do Tempo
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Escreva uma carta para o seu eu futuro. Ela fica selada e imutável
            até a data de abertura — um recado atravessando o tempo.
          </p>
          <Button size="sm" className="mt-6" onClick={() => setOpen(true)}>
            Selar a primeira cápsula
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {sealed.length > 0 && (
            <Section title="Seladas" detail="O tempo faz o resto">
              <div className="grid gap-4 md:grid-cols-2">
                {sealed.map((c) => (
                  <article
                    className="capsule-card"
                    key={c.id}
                    data-state="sealed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="status status-review">Selada</span>
                      <span className="capsule-countdown">
                        <Hourglass className="size-3" />
                        {daysUntil(c.unlock_at)} dias
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">
                      {c.title}
                    </h3>
                    <p className="capsule-mask mt-3">
                      ██████ ████ ███████ ██ █████ ████ █████
                    </p>
                    <p className="mt-4 text-xs text-faint">
                      Abre em {c.unlock_at}
                    </p>
                  </article>
                ))}
              </div>
            </Section>
          )}
          {ready.length > 0 && (
            <Section title="Prontas para abrir" detail="O futuro chegou">
              <div className="grid gap-4 md:grid-cols-2">
                {ready.map((c) => (
                  <article
                    className="capsule-card"
                    key={c.id}
                    data-state="openable"
                  >
                    <div className="flex items-center justify-between">
                      <span className="status status-open">Aberta</span>
                      <span className="text-xs text-faint">{c.unlock_at}</span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">
                      {c.title}
                    </h3>
                    {c.opened_at ? (
                      <p className="capsule-content mt-3">{c.content}</p>
                    ) : (
                      <>
                        <p className="capsule-mask mt-3">
                          ██████ ████ ███████ ██ █████
                        </p>
                        <Button
                          size="sm"
                          className="mt-4"
                          disabled={openCapsule.isPending}
                          onClick={() =>
                            openCapsule.mutate(c.id, {
                              onSuccess: () =>
                                toast.success(
                                  "Cápsula aberta — bem-vindo ao seu futuro.",
                                ),
                              onError: (e) =>
                                toast.error(
                                  e instanceof Error
                                    ? e.message
                                    : "Falha ao abrir.",
                                ),
                            })
                          }
                        >
                          Abrir cápsula
                        </Button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </>
  );
}

function TimelineSection({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof BriefcaseBusiness;
  title: string;
  rows: string[][];
}) {
  return (
    <Section title={title}>
      <div className="space-y-6">
        {rows.map(([date, place, role]) => (
          <div className="flex gap-4" key={`${date}-${place}`}>
            <div className="icon-tile">
              <Icon />
            </div>
            <div>
              <p className="text-xs text-faint">{date}</p>
              <h3 className="mt-1 text-sm font-semibold">{place}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        {title}
      </h3>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li className="text-sm text-muted-foreground" key={i}>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SmallFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="quiet-panel">
      <Icon className="size-4 text-accent-foreground" />
      <p className="mt-4 text-xs text-faint">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
