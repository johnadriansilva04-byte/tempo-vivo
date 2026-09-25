import { describe, expect, it } from "vitest";
import { filterPeople, matchesTerm, profilePath } from "@/lib/network";

const people = [
  { handle: "joao-adrian", name: "João Adrián", role: "Pesquisador", location: "São Paulo" },
  { handle: "ana-teste", name: "Ana Teste", role: "Engenheira", location: "Recife" },
  { handle: "bruno", name: "Bruno Lima", role: "Professor", location: "Curitiba" },
];

describe("matchesTerm", () => {
  it("casa com termo vazio", () => {
    expect(matchesTerm(people[0]!, "")).toBe(true);
    expect(matchesTerm(people[0]!, "   ")).toBe(true);
  });

  it("encontra pelo nome, ignorando acentos e caixa", () => {
    expect(matchesTerm(people[0]!, "joao")).toBe(true);
    expect(matchesTerm(people[0]!, "JOÃO")).toBe(true);
  });

  it("encontra pelo @handle", () => {
    expect(matchesTerm(people[0]!, "@joao")).toBe(true);
    expect(matchesTerm(people[1]!, "ana-teste")).toBe(true);
  });

  it("encontra pela atuação e pela cidade", () => {
    expect(matchesTerm(people[1]!, "engenheira")).toBe(true);
    expect(matchesTerm(people[2]!, "curitiba")).toBe(true);
  });

  it("recusa termos que não existem", () => {
    expect(matchesTerm(people[0]!, "marte")).toBe(false);
  });
});

describe("filterPeople", () => {
  it("devolve todos com termo vazio", () => {
    expect(filterPeople(people, "").length).toBe(3);
  });

  it("preserva a ordem original", () => {
    expect(filterPeople(people, "o").map((p) => p.handle)).toContain("bruno");
  });

  it("devolve vazio quando nada casa", () => {
    expect(filterPeople(people, "zzz")).toEqual([]);
  });
});

describe("profilePath", () => {
  it("monta o caminho com @", () => {
    expect(profilePath("joao-adrian")).toBe("/@joao-adrian");
    expect(profilePath("@Ana-Teste")).toBe("/@ana-teste");
  });
});
