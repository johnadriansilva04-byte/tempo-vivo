import { useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Gamepad2,
  Globe2,
  GraduationCap,
  Heart,
  LockKeyhole,
  MapPin,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, ProgressBar, Section } from "@/components/page-kit";
import type { Project } from "@/types/profile";
import { DailyLogCard } from "@/components/daily-log-card";
import { EmptyState } from "@/components/empty-state";
import { FocusCard } from "@/components/focus-card";
import { useDailyLogs, useOpenTodayLog } from "@/hooks/use-daily-logs";
import { useProfile } from "@/hooks/use-profile";
import { usePrologue, useSetPrologue } from "@/hooks/use-prologue";
import { useCareerChapters, useCreateCareerChapter } from "@/hooks/use-career-chapters";
import { useMilestones, useCreateMilestone } from "@/hooks/use-milestones";
import { useProjects, useUpsertProject } from "@/hooks/use-projects";
import { useCreateFocus } from "@/hooks/use-weekly-focus";

// ---------------------------------------------------------------- AgendaPage

export function AgendaPage() {
  const { logs, isLoading } = useDailyLogs();
  const { profile } = useProfile();
  const { prologue, isLoading: prologueLoading } = usePrologue();
  const [prologueDraft, setPrologueDraft] = useState<string | null>(null);
  const [savingPrologue, setSavingPrologue] = useState(false);
  const setPrologue = useSetPrologue();
  const openToday = useOpenTodayLog();

  // Quando o draft é null, usamos o valor reativo do banco; assim o campo espelha
  // o prólogo salvo e a atualização via mutation reflete sem reload.

  return (
    <>
      <PageHeader
        eyebrow="Livro de bordo"
        title="Agenda"
        description="Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido."
        action={
          profile?.name && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("prologue-editor");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Escrever prólogo
            </Button>
          )
        }
      />

      {/* Prólogo — vazio até o dono escrever. Nada inventado. */}
      <section id="prologue-editor" className="prologue">
        <div className="prologue-icon">
          <FileText />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status status-archive">Início</span>
            <span className="text-xs text-faint">Documento de origem • seu relato</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">Relatório dos anos anteriores</h2>
          {profile && profile.name.trim() === "" ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Defina seu nome em{" "}
              <a
                href="/configuracoes"
                className="font-medium text-primary underline underline-offset-2"
              >
                Configurações
              </a>{" "}
              e volte aqui para escrever o prólogo — só o seu relato será exibido.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Escreva o resumo honesto dos anos que precedem o primeiro dia neste app. Ele ficará
                afixado no topo da sua agenda.
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
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
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
      ) : (
        <div className="space-y-5">
          {logs.map((log) => (
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

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft as Parameters<typeof create.mutate>[0], {
      onSuccess: () => {
        setDraft({ title: "", period: "", document_type: "EXPERIENCE", content: "" });
        setOpen(false);
      },
    });
  };

  if (isLoading)
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />;

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
                onChange={(e) => setDraft({ ...draft, document_type: e.target.value })}
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
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
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
          </div>
          <aside className="space-y-7">
            {experiences.length === 0 && education.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Preencha seu histórico para montar sua página.
              </p>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</Label>
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
      (Math.floor((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7,
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
      <Section title="Metas da semana" detail="Progresso comprometido, não desejado">
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
              onChange={(e) => setInput({ ...input, description: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <Button size="sm" onClick={submit} disabled={!input.title.trim() || create.isPending}>
            Adicionar
          </Button>
        </div>
      </Section>
      <Section
        title="Roadmap do ano"
        detail="Quatro movimentos que conduzem 2026"
        className="mt-10"
      >
        <div className="roadmap">
          {["Investigar", "Documentar", "Compartilhar", "Preservar"].map((x, i) => (
            <div key={x}>
              <span>{i + 1}</span>
              <p>{x}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
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
    create.mutate(draft, { onSuccess: () => setDraft({ ...draft, title: "", description: "" }) });
  };

  if (isLoading)
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />;

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
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Como isso mudou sua história"
            />
          </div>
          <Button size="sm" onClick={submit} disabled={!draft.title.trim() || create.isPending}>
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
                <h2 className="mt-3 font-display text-xl font-semibold">{m.title}</h2>
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
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    objective: "",
    status: "Planejado" as Project["status"],
  });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!draft.name.trim()) return;
    upsert.mutate(
      { ...draft, name: draft.name.trim(), progress: 0 },
      {
        onSuccess: () =>
          setDraft({ name: "", description: "", objective: "", status: "Planejado" }),
      },
    );
  };

  if (isLoading)
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />;

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
                  setDraft({ ...draft, status: e.target.value as Project["status"] })
                }
              >
                <option value="Planejado">Planejado</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Pesquisa">Pesquisa</option>
                <option value="Concluído">Concluído</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descrição">
                <Input
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Em poucas palavras"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Objetivo">
                <Input
                  value={draft.objective}
                  onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
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
            <article className="project-card" key={p.name}>
              <div className="flex justify-between">
                <span className="status status-neutral">{p.status}</span>
                <span className="text-xs font-medium">{p.progress}%</span>
              </div>
              <h2 className="mt-6 font-display text-xl font-semibold">{p.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.description}</p>
              <p className="mt-5 text-xs text-faint">Objetivo</p>
              <p className="mt-1 text-sm">{p.objective}</p>
              <div className="mt-6">
                <ProgressBar value={p.progress} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ AboutPage

export function AboutPage() {
  const { profile } = useProfile();
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
          <p className="font-display text-2xl leading-relaxed text-foreground">
            “Quero compreender como guardamos o que vivemos e como essas memórias podem orientar
            futuros mais humanos.”
          </p>
          {isBlank ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Complete seu perfil"
              description="Sua apresentação e família aparecerão aqui quando você preencher suas informações."
              actionLabel="Abrir Configurações"
              onAction={() => (window.location.href = "/configuracoes")}
            />
          ) : (
            <>
              <p className="mt-6 text-sm leading-7 text-muted-foreground">
                {profile.bio || "Sua bio aparecerá aqui."} Minha história é atravessada por cidades,
                relatos de família e pela vontade de transformar lembranças dispersas em
                conhecimento compartilhado.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <SmallFact icon={MapPin} label="Vive em" value={profile.location || "—"} />
                <SmallFact icon={Globe2} label="Nasceu em" value="—" />
              </div>
            </>
          )}
        </div>
        <div className="family-panel">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-accent-foreground" />
            <h2 className="font-display text-lg font-semibold">Núcleo familiar</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Edite seus vínculos em Configurações para vê-los aqui. Seus dados não são uma rede
            social — são sua história.
          </p>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-faint">
            Vínculos preservados como parte da trajetória, não como conexões sociais.
          </p>
        </div>
      </div>
    </>
  );
}

export function GamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Exploração futura"
        title="Jogos"
        description="Experiências que transformarão autoconhecimento e memória em jornadas interativas."
      />
      <div className="games-stage">
        <div className="game-orbit">
          <Gamepad2 />
        </div>
        <span className="status status-open">
          <Sparkles className="size-3" />
          Em preparação
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Sua história também pode ser explorada
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          No futuro, desafios de memória, mapas de decisões e cápsulas do tempo ganharão vida aqui.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Mapa de memórias", "Linha do tempo", "Cápsula do futuro"].map((x) => (
            <div className="locked-game" key={x}>
              <LockKeyhole />
              <span>{x}</span>
            </div>
          ))}
        </div>
      </div>
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
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</h3>
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
