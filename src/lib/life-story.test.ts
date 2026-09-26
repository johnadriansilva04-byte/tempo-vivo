import { describe, expect, it } from "vitest";
import { cycleForAge, buildStarterLife, stripAppPrompts, EMPTY_ANSWERS } from "@/lib/life-story";
import type { Account } from "@/types/auth";

const account = (over: Partial<Account> = {}): Account => ({
  id: "acc-1",
  name: "Helena Duarte",
  phone: "21988881122",
  age: 34,
  birth_date: "1992-09-24",
  onboarding_completed: false,
  created_at: "2026-09-24T00:00:00.000Z",
  ...over,
});

describe("cycleForAge", () => {
  it("mapeia cada quarto de vida ao ciclo correto", () => {
    expect(cycleForAge(0).index).toBe(0);
    expect(cycleForAge(24).index).toBe(0);
    expect(cycleForAge(25).index).toBe(1);
    expect(cycleForAge(49).index).toBe(1);
    expect(cycleForAge(50).index).toBe(2);
    expect(cycleForAge(75).index).toBe(3);
  });

  it("satura no último ciclo para idades extremas", () => {
    expect(cycleForAge(120).index).toBe(3);
    expect(cycleForAge(999).index).toBe(3);
  });
});

describe("buildStarterLife — preset blank", () => {
  it("cria uma vida navegável mas vazia, sem inventar conteúdo", () => {
    const life = buildStarterLife(account(), "blank");
    expect(life.prologue).toBe("");
    expect(life.chapters).toEqual([]);
    expect(life.milestones).toEqual([]);
    expect(life.projects).toEqual([]);
    expect(life.focus).toEqual([]);
    expect(life.dailyLog.planned_text).toBe("");
    expect(life.profile.name).toBe("Helena Duarte");
  });
});

describe("buildStarterLife — preset guided", () => {
  it("usa a resposta de origem como local do perfil", () => {
    const life = buildStarterLife(account(), "guided", {
      ...EMPTY_ANSWERS,
      origin: "Belo Horizonte, Minas Gerais",
    });
    // Regressão: a origem já ficou só no prólogo e deixou a página Sobre em branco.
    expect(life.profile.location).toBe("Belo Horizonte, Minas Gerais");
  });

  it("esvazia a origem no perfil quando a resposta é vazia", () => {
    const life = buildStarterLife(account(), "guided", EMPTY_ANSWERS);
    expect(life.profile.location).toBe("");
  });

  it("monta o prólogo com o nome e o ano de nascimento reais", () => {
    const life = buildStarterLife(account(), "guided", {
      ...EMPTY_ANSWERS,
      origin: "Salvador",
    });
    expect(life.prologue).toContain("Meu nome é Helena");
    expect(life.prologue).toContain("nasci em 1992");
    expect(life.prologue).toContain("Nasci em Salvador.");
  });

  it("omite trechos em branco em vez de escrever pelo dono", () => {
    const life = buildStarterLife(account(), "guided", EMPTY_ANSWERS);
    // Sem jornada/intenção: o prólogo não pode conter linhas de instrução vazias.
    expect(life.prologue).not.toContain("[");
    expect(life.prologue).toContain("Nasci e cresci.");
  });

  it("inclui jornada e intenção quando o dono as escreve", () => {
    const life = buildStarterLife(account(), "guided", {
      origin: "Recife",
      journey: "Trabalhei com educação por dez anos.",
      intention: "Quero escrever um livro.",
      focus: "Terminar o primeiro capítulo",
    });
    expect(life.prologue).toContain("Trabalhei com educação por dez anos.");
    expect(life.prologue).toContain("Quero escrever um livro.");
    expect(life.dailyLog.planned_text).toContain("Terminar o primeiro capítulo");
    expect(life.focus[0]?.title).toBe("Terminar o primeiro capítulo");
  });

  it("nunca usa a intenção como título de conquista", () => {
    // Regressão: a intenção (um parágrafo) virou título e estourou o card na
    // vitrine pública. Título é rótulo curto; a intenção vai para a descrição.
    const intention =
      "Quero investigar, por meio de evidências empíricas, se a negligência estatal é realmente um conjunto de erros isolados.";
    const life = buildStarterLife(account(), "guided", {
      ...EMPTY_ANSWERS,
      intention,
    });
    const titles = life.milestones.map((m) => m.title);
    expect(titles).not.toContain(intention);
    for (const title of titles) {
      expect(title.length).toBeLessThan(60);
    }
    expect(life.milestones.some((m) => m.description === intention)).toBe(true);
  });

  it("marca os capítulos como convites entre colchetes, não como fatos", () => {
    const life = buildStarterLife(account(), "guided", EMPTY_ANSWERS);
    expect(life.chapters.length).toBeGreaterThan(0);
    for (const chapter of life.chapters) {
      expect(chapter.content).toContain("[");
    }
  });

  it("o diário nasce OPEN e sem conteúdo executado", () => {
    const life = buildStarterLife(account(), "guided", EMPTY_ANSWERS);
    expect(life.dailyLog.status).toBe("OPEN");
    expect(life.dailyLog.executed_text).toBe("");
    expect(life.dailyLog.summary_text).toBe("");
    expect(life.dailyLog.locked_at).toBeNull();
  });
});

describe("stripAppPrompts", () => {
  it("remove linhas de instrução de versões antigas", () => {
    const legacy = [
      "Antes deste app: [escreva aqui]",
      "Eu trabalhei com música.",
      "O que me trouxe até aqui: [explique]",
    ].join("\n");
    const clean = stripAppPrompts(legacy);
    expect(clean).toBe("Eu trabalhei com música.");
  });

  it("preserva colchetes que fazem parte do texto do dono", () => {
    const own = "Terminei o curso de [enfermagem] em 2019.";
    expect(stripAppPrompts(own)).toBe(own);
  });

  it("normaliza excesso de linhas em branco", () => {
    expect(stripAppPrompts("a\n\n\n\nb")).toBe("a\n\nb");
  });
});
