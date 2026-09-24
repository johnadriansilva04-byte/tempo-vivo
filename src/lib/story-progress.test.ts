import { describe, expect, it } from "vitest";
import { computeStoryProgress } from "@/lib/story-progress";
import type {
  CareerChapter,
  DailyLog,
  Milestone,
  Profile,
  Project,
  WeeklyFocus,
} from "@/types/profile";

const baseProfile: Profile = {
  id: "p1",
  name: "Helena Duarte",
  role: "Professora",
  location: "Recife",
  bio: "",
  initials: "HD",
  birth_date: "1992-09-24",
  target_lifespan: 100,
  avatar_url: null,
  cover_url: null,
};

const empty = {
  profile: null as Profile | null,
  prologue: "",
  logs: [] as DailyLog[],
  focus: [] as WeeklyFocus[],
  chapters: [] as CareerChapter[],
  milestones: [] as Milestone[],
  projects: [] as Project[],
};

const step = (result: ReturnType<typeof computeStoryProgress>, id: string) =>
  result.steps.find((s) => s.id === id);

describe("computeStoryProgress — nada é dado como pronto sem palavra do dono", () => {
  it("vida vazia: nenhum passo concluído e 0%", () => {
    const result = computeStoryProgress(empty);
    expect(result.doneCount).toBe(0);
    expect(result.pct).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.nextStep?.id).toBe("identity");
  });

  it("identidade exige nome E (papel OU local)", () => {
    const onlyName = computeStoryProgress({
      ...empty,
      profile: { ...baseProfile, role: "", location: "" },
    });
    expect(step(onlyName, "identity")?.done).toBe(false);

    const withRole = computeStoryProgress({ ...empty, profile: baseProfile });
    expect(step(withRole, "identity")?.done).toBe(true);
  });

  it("prólogo exige 60 caracteres e nenhum colchete do app", () => {
    const short = computeStoryProgress({ ...empty, prologue: "Curto." });
    expect(step(short, "prologue")?.done).toBe(false);

    const placeholder = computeStoryProgress({
      ...empty,
      prologue: "[O que me trouxe até aqui: escreva sua história completa aqui com calma]",
    });
    expect(step(placeholder, "prologue")?.done).toBe(false);

    const real = computeStoryProgress({
      ...empty,
      prologue:
        "Nasci em Recife e cresci entre livros. Trabalhei dez anos com educação e hoje escrevo.",
    });
    expect(step(real, "prologue")?.done).toBe(true);
  });

  it("o primeiro dia exige um diário com resumo escrito", () => {
    const openLog: DailyLog = {
      id: "l1",
      log_date: "2026-09-24",
      planned_text: "Planejei o dia",
      executed_text: "Fiz",
      summary_text: "",
      status: "OPEN",
      locked_at: null,
      created_at: "2026-09-24T10:00:00.000Z",
    };
    expect(step(computeStoryProgress({ ...empty, logs: [openLog] }), "ritual")?.done).toBe(false);

    const closed = { ...openLog, summary_text: "Fechei o dia com o que importava." };
    expect(step(computeStoryProgress({ ...empty, logs: [closed] }), "ritual")?.done).toBe(true);
  });

  it("título de capítulo com palavras do app não conta como capítulo concluído", () => {
    const promptChapter: CareerChapter = {
      id: "c1",
      title: "Formação ou aprendizado fundador",
      period: "",
      document_type: "EDUCATION",
      // Convite do onboarding (curto + colchetes): não é palavra do dono.
      content: "[O que você estudou, onde, e o que isso mudou no seu jeito de pensar.]",
    };
    expect(
      step(computeStoryProgress({ ...empty, chapters: [promptChapter] }), "chapter")?.done,
    ).toBe(false);

    const ownChapter: CareerChapter = {
      ...promptChapter,
      content: "Estudei pedagogia na UFPE e isso mudou como eu enxergo o aprendizado.",
    };
    expect(step(computeStoryProgress({ ...empty, chapters: [ownChapter] }), "chapter")?.done).toBe(
      true,
    );
  });

  it("projeto só conta com objetivo escrito pelo dono", () => {
    const noObjective: Project = {
      name: "Livro",
      description: "Um livro",
      status: "Planejado",
      progress: 0,
      objective: "",
    };
    expect(step(computeStoryProgress({ ...empty, projects: [noObjective] }), "project")?.done).toBe(
      false,
    );

    const withObjective: Project = {
      ...noObjective,
      objective: "Publicar o primeiro capítulo até dezembro.",
    };
    expect(
      step(computeStoryProgress({ ...empty, projects: [withObjective] }), "project")?.done,
    ).toBe(true);
  });

  it("meta da semana conta pela presença de foco", () => {
    const focus: WeeklyFocus[] = [
      {
        id: "f1",
        title: "Escrever",
        description: "",
        week_number: 39,
        year: 2026,
        progress_pct: 0,
      },
    ];
    expect(step(computeStoryProgress({ ...empty, focus }), "focus")?.done).toBe(true);
  });

  it("nextStep aponta o primeiro pendente na ordem dos passos", () => {
    const result = computeStoryProgress({ ...empty, profile: baseProfile });
    expect(step(result, "identity")?.done).toBe(true);
    expect(result.nextStep?.id).toBe("prologue");
  });

  it("vida completa atinge 100% e não sugere próximo passo", () => {
    const result = computeStoryProgress({
      profile: baseProfile,
      prologue: "Nasci em Recife e cresci entre livros, sempre escrevendo sobre o que via.",
      logs: [
        {
          id: "l1",
          log_date: "2026-09-24",
          planned_text: "P",
          executed_text: "E",
          summary_text: "Resumo do dia escrito por mim.",
          status: "OPEN",
          locked_at: null,
          created_at: "2026-09-24T10:00:00.000Z",
        },
      ],
      focus: [
        {
          id: "f1",
          title: "Escrever",
          description: "",
          week_number: 39,
          year: 2026,
          progress_pct: 0,
        },
      ],
      chapters: [
        {
          id: "c1",
          title: "Formação",
          period: "2010",
          document_type: "EDUCATION",
          content: "Estudei pedagogia e mudei minha forma de ensinar.",
        },
      ],
      milestones: [
        {
          year: "2015",
          title: "Meu primeiro livro",
          description: "Publiquei sozinha.",
          category: "Vida",
        },
      ],
      projects: [
        {
          name: "Livro 2",
          description: "",
          status: "Em curso",
          progress: 30,
          objective: "Terminar a segunda obra até o fim do ano.",
        },
      ],
    });
    expect(result.doneCount).toBe(result.total);
    expect(result.pct).toBe(100);
    expect(result.complete).toBe(true);
    expect(result.nextStep).toBeNull();
  });
});
