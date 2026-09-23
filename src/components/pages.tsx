import { useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Gamepad2,
  Globe2,
  GraduationCap,
  Heart,
  LockKeyhole,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, ProgressBar, Section } from "@/components/page-kit";
import { DailyLogCard } from "@/components/daily-log-card";
import { FocusCard } from "@/components/focus-card";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useProfile } from "@/hooks/use-profile";
import { useCareerChapters } from "@/hooks/use-career-chapters";
import { getLifePrologue, getMilestones, getProjects } from "@/services/profile-service";

export function AgendaPage() {
  const { logs, isLoading } = useDailyLogs();
  const prologue = getLifePrologue();

  return (
    <>
      <PageHeader
        eyebrow="Livro de bordo"
        title="Agenda"
        description="Memória cronológica da vida real. O planejado orienta; o executado documenta; o resumo dá sentido."
      />

      <section className="prologue">
        <div className="prologue-icon">
          <FileText />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status status-archive">Início</span>
            <span className="text-xs text-faint">Documento de origem • PDF vivo</span>
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold">Relatório dos anos anteriores</h2>
          <PrologueText text={prologue} />
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Baixar relatório"
          title="Baixar relatório"
        >
          <Download />
        </Button>
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

function PrologueText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className={`prologue-text ${expanded ? "expanded" : ""}`}>
        {text.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 -ml-3"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown /> : <ChevronRight />}
        {expanded ? "Recolher relatório" : "Ler relatório completo"}
      </Button>
    </>
  );
}

export function ResumePage() {
  const { chapters, isLoading } = useCareerChapters();
  const byType = (t: string) => chapters.filter((c) => c.document_type === t);
  const experiences = byType("EXPERIENCE");
  const education = byType("EDUCATION");

  return (
    <>
      <PageHeader
        eyebrow="Trajetória profissional"
        title="Currículo vivo"
        description="Formação e experiências apresentadas como partes de uma história humana, prontas para compartilhar."
        action={
          <Button variant="outline">
            <Download />
            Exportar
          </Button>
        }
      />
      <div className="grid gap-9 lg:grid-cols-[1fr_280px]">
        <div className="space-y-9">
          <TimelineSection
            icon={BriefcaseBusiness}
            title="Experiência"
            rows={(experiences.length ? experiences : FALLBACK_EXPERIENCES).map((c) => [
              c.period,
              c.title,
              c.content,
            ])}
          />
          <TimelineSection
            icon={GraduationCap}
            title="Formação"
            rows={(education.length ? education : FALLBACK_EDUCATION).map((c) => [
              c.period,
              c.title,
              c.content,
            ])}
          />
          <TimelineSection icon={BookOpen} title="Produções" rows={FALLBACK_PRODUCTIONS} />
        </div>
        <aside className="space-y-7">
          <InfoList
            title="Habilidades"
            items={["Pesquisa qualitativa", "Narrativas", "Etnografia", "Curadoria"]}
          />
          <InfoList
            title="Idiomas"
            items={["Português • nativo", "Inglês • avançado", "Espanhol • intermediário"]}
          />
          <InfoList title="Certificados" items={["Design de Futuros", "História Oral"]} />
        </aside>
      </div>
    </>
  );
}

const FALLBACK_EXPERIENCES = [
  {
    id: "f1",
    title: "Instituto Horizonte",
    period: "2022 — hoje",
    document_type: "EXPERIENCE",
    content: "Pesquisadora líder em futuros humanos.",
  },
  {
    id: "f2",
    title: "Observatório Urbano",
    period: "2018 — 2022",
    document_type: "EXPERIENCE",
    content: "Pesquisadora e documentarista.",
  },
];

const FALLBACK_EDUCATION = [
  {
    id: "f3",
    title: "USP",
    period: "2022 — 2024",
    document_type: "EDUCATION",
    content: "Mestrado em Antropologia Social.",
  },
  {
    id: "f4",
    title: "UFMG",
    period: "2013 — 2017",
    document_type: "EDUCATION",
    content: "Comunicação Social.",
  },
];

const FALLBACK_PRODUCTIONS: string[][] = [
  ["2026", "Atlas da Memória", "Pesquisa selecionada para publicação"],
  ["2024", "As cidades que carregamos", "Dissertação de mestrado"],
];

const goals = [
  { name: "Publicar Atlas da Memória", progress: 68, when: "Dezembro 2026" },
  { name: "Correr minha primeira meia maratona", progress: 44, when: "Março 2027" },
  { name: "Registrar histórias da família", progress: 75, when: "Contínuo" },
];

export function PlanningPage() {
  return (
    <>
      <PageHeader
        eyebrow="Direção consciente"
        title="Planejamento"
        description="Objetivos que conectam intenção, ações e o futuro que está sendo construído."
        action={<Button>Novo objetivo</Button>}
      />
      <Section title="Metas da semana" detail="Progresso comprometido, não desejado">
        <FocusCard />
      </Section>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {goals.map((g, i) => (
          <article className="goal-card" key={g.name}>
            <span className="goal-number">0{i + 1}</span>
            <h2 className="mt-8 font-display text-lg font-semibold">{g.name}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Horizonte: {g.when}</p>
            <div className="mt-8">
              <div className="mb-2 flex justify-between text-xs">
                <span>Progresso</span>
                <strong>{g.progress}%</strong>
              </div>
              <ProgressBar value={g.progress} />
            </div>
          </article>
        ))}
      </div>
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

export function AchievementsPage() {
  const milestones = getMilestones();
  return (
    <>
      <PageHeader
        eyebrow="Marcos preservados"
        title="Realizações"
        description="Uma linha do tempo do que mudou sua história — grandes conquistas e viradas silenciosas."
      />
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
    </>
  );
}

export function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHeader
        eyebrow="Trabalho em movimento"
        title="Projetos"
        description="Iniciativas que conectam curiosidade, propósito e impacto ao longo do tempo."
        action={<Button>Novo projeto</Button>}
      />
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
    </>
  );
}

export function AboutPage() {
  const { profile } = useProfile();
  return (
    <>
      <PageHeader
        eyebrow="Quem sou"
        title={profile ? `Sobre ${profile.name.split(" ")[0]}` : "Sobre"}
        description="A pessoa por trás dos registros, seus vínculos e o sentido que atravessa sua trajetória."
      />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-display text-2xl leading-relaxed text-foreground">
            “Quero compreender como guardamos o que vivemos e como essas memórias podem orientar
            futuros mais humanos.”
          </p>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            {profile?.bio} Minha história é atravessada por cidades, relatos de família e pela
            vontade de transformar lembranças dispersas em conhecimento compartilhado.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <SmallFact icon={MapPin} label="Vive em" value={profile?.location ?? "—"} />
            <SmallFact icon={Globe2} label="Nasceu em" value="Belo Horizonte" />
          </div>
        </div>
        <div className="family-panel">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-accent-foreground" />
            <h2 className="font-display text-lg font-semibold">Núcleo familiar</h2>
          </div>
          <div className="mt-6 space-y-4">
            {[
              ["MC", "Marina Costa", "Mãe"],
              ["RC", "Rafael Costa", "Irmão"],
              ["LB", "Luísa Braga", "Companheira"],
            ].map(([i, n, r]) => (
              <div className="flex items-center gap-3" key={n}>
                <div className="avatar-small">{i}</div>
                <div>
                  <p className="text-sm font-medium">{n}</p>
                  <p className="text-xs text-muted-foreground">{r}</p>
                </div>
              </div>
            ))}
          </div>
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
