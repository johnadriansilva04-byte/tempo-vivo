import { useState } from "react";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Gamepad2,
  Globe2,
  GraduationCap,
  Heart,
  MapPin,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageSkeleton, ProgressBar, Section } from "@/components/page-kit";
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
import { useAuth } from "@/hooks/use-auth";
import { cycleForAge, CYCLES } from "@/lib/life-story";
import { StoryText } from "@/components/story-text";
import { isPlaceholderText } from "@/lib/placeholder";

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
  // Tipos que o dono criar sem se encaixar nas seções acima não somem da página.
  const otherTypes = chapters.filter(
    (c) =>
      !["EXPERIENCE", "EDUCATION", "PRODUCTION", "CERTIFICATE", "PROLOGUE"].includes(
        c.document_type,
      ),
  );

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft as Parameters<typeof create.mutate>[0], {
      onSuccess: () => {
        setDraft({ title: "", period: "", document_type: "EXPERIENCE", content: "" });
        setOpen(false);
      },
    });
  };

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Trajetória profissional"
        title="Currículo vivo"
        mark="II"
        description="Formação e experiências apresentadas como partes de uma história humana, prontas para compartilhar."
        lede="Currículo não é lista de cargos: é a prova de que algo em você mudou a cada etapa."
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
          actionLabel="Adicionar o primeiro capítulo"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="reveal grid gap-9 lg:grid-cols-[1fr_280px]">
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
                icon={Sparkles}
                title="Produção"
                rows={productions.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {certificates.length > 0 && (
              <TimelineSection
                icon={Award}
                title="Certificados"
                rows={certificates.map((c) => [c.period, c.title, c.content])}
              />
            )}
            {otherTypes.length > 0 && (
              <TimelineSection
                icon={BriefcaseBusiness}
                title="Outros registros"
                rows={otherTypes.map((c) => [c.period, c.title, c.content])}
              />
            )}
          </div>
          <aside className="space-y-7">
            {chapters.length === 0 && (
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
  const { account } = useAuth();
  const cycle = cycleForAge(account?.age ?? 0);
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
        mark="III"
        description="Objetivos que conectam intenção, ações e o futuro que está sendo construído."
        lede="Semana sem direção vira semana perdida. Aqui a intenção vira compromisso visível."
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
        title="Horizonte do ciclo"
        detail={`${cycle.index + 1}º ciclo · ${cycle.name} — ${cycle.range} anos`}
        className="mt-10"
      >
        <p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Seu ciclo atual trata de {cycle.intent}. As metas da semana são o que transforma esse
          propósito em movimento.
        </p>
        <div className="roadmap">
          {CYCLES.map((c) => (
            <div key={c.index} data-current={c.index === cycle.index}>
              <span>{c.range}</span>
              <p>{c.name}</p>
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

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Marcos preservados"
        title="Realizações"
        mark="IV"
        description="Uma linha do tempo do que mudou sua história — grandes conquistas e viradas silenciosas."
        lede="O que você já atravessou é argumento: prova concreta de que consegue de novo."
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
            <article key={`${m.year}-${m.title}`}>
              <div className="achievement-year">{isPlaceholderText(m.year) ? "" : m.year}</div>
              <div className="achievement-dot" />
              <div className="pb-10">
                <span className="status status-neutral">{m.category}</span>
                <h2 className="mt-3 font-display text-xl font-semibold">
                  <StoryText text={m.title} />
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  <StoryText text={m.description} />
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

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Trabalho em movimento"
        title="Projetos"
        mark="V"
        description="Iniciativas que conectam curiosidade, propósito e impacto ao longo do tempo."
        lede="Projeto é intenção com prazo. Aqui ela sai do papel e ganha dono, objetivo e avanço."
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
              <h2 className="mt-6 font-display text-xl font-semibold">
                <StoryText text={p.name} />
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                <StoryText text={p.description} />
              </p>
              {p.objective.trim() !== "" && (
                <>
                  <p className="mt-5 text-xs text-faint">Objetivo</p>
                  <p className="mt-1 text-sm">
                    <StoryText text={p.objective} />
                  </p>
                </>
              )}
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
        mark="VI"
        description="A pessoa por trás dos registros, seus vínculos e o sentido que atravessa sua trajetória."
        lede="Um perfil não é vitrine: é o retrato de quem está por trás dos registros."
      />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
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
              {profile.bio.trim() !== "" ? (
                <p className="font-display text-2xl leading-relaxed text-foreground">
                  “{profile.bio}”
                </p>
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  Escreva sua bio em Configurações para apresentar sua trajetória aqui.
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <SmallFact icon={MapPin} label="Vive em" value={profile.location || "—"} />
                <SmallFact
                  icon={Globe2}
                  label="Nasceu em"
                  value={profile.birth_date ? profile.birth_date.slice(0, 4) : "—"}
                />
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

const PRACINHA = "https://pracinha.online";

const PRACTICE_GROUNDS = [
  {
    href: `${PRACINHA}/teste-de-qi`,
    icon: Brain,
    name: "Teste de QI",
    tag: "Raciocínio",
    description:
      "Trilha de treino com matrizes lógicas geradas na hora e explicação das regras a cada resposta, ou simulação completa e cronometrada.",
  },
  {
    href: `${PRACINHA}/cidadela`,
    icon: Swords,
    name: "Cidadela dos Clássicos",
    tag: "Estratégia",
    description:
      "Xadrez, dama, trilha, sumô de carros e futebol do campus. Partidas rápidas para exercitar a cabeça entre um registro e outro.",
  },
  {
    href: `${PRACINHA}/campus`,
    icon: GraduationCap,
    name: "Campus Universitário",
    tag: "Comunidade",
    description:
      "Escolha uma função, circule pela biblioteca e pelos laboratórios e use o gerador de texto do campus.",
  },
] as const;

export function GamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Parceria Pracinha"
        title="Jogos"
        mark="VII"
        description="A Cidadela do Pracinha abre uma pracinha de jogos, testes e estudo para descansar a cabeça e voltar à história com a mente afiada."
        lede="Descanso também faz parte da obra. Jogar afia a mente que volta a registrar."
      />

      <div className="games-stage">
        <div className="game-orbit">
          <Gamepad2 />
        </div>
        <span className="status status-open">
          <Sparkles className="size-3" />
          Ligado à pracinha.online
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Uma pracinha inteira para jogar
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          O Perfil Vivo guarda sua trajetória. A pracinha cuida do intervalo: teste de QI, clássicos
          de tabuleiro e o campus da Cidadela.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <a href={PRACINHA} target="_blank" rel="noopener noreferrer">
              Visitar a Cidadela
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <Section
        className="mt-10"
        title="Caminhos da pracinha"
        detail="Abre em uma nova aba, no site da Cidadela do Pracinha."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {PRACTICE_GROUNDS.map(({ href, icon: Icon, name, tag, description }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="game-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="icon-tile">
                  <Icon />
                </div>
                <ArrowUpRight className="size-4 text-faint" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                {tag}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </a>
          ))}
        </div>
      </Section>
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
        {rows.map(([date = "", place = "", role = ""]) => (
          <div className="flex gap-4" key={`${date}-${place}`}>
            <div className="icon-tile">
              <Icon />
            </div>
            <div>
              {date.trim() !== "" && !isPlaceholderText(date) && (
                <p className="text-xs text-faint">{date}</p>
              )}
              <h3 className="mt-1 text-sm font-semibold">
                <StoryText text={place} />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <StoryText text={role} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
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
