import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// O link compartilhado precisa abrir SEM sessão. Quem chega pelo link é
// visitante anônimo: não há conta logada, então a leitura pública não pode
// depender de `currentAccount()`. Este teste trava essa regressão.
// ---------------------------------------------------------------------------

const ROW = {
  id: "u1",
  handle: "joao-adrian",
  slug: "joao-adrian",
  profile_data: {
    full_name: "João Adrian",
    role: "Pesquisador",
    location: "São Paulo",
    bio: "Construo sistemas.",
    avatar_url: null,
    cover_url: null,
  },
  milestones: [],
  projects: [],
  chapters: [],
  agenda: [],
  focus: [],
};

/** Cliente Supabase falso: registra se a leitura pública foi feita por anon. */
const anonReads: string[] = [];
const fakeDb = {
  from(table: string) {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => {
        anonReads.push(table);
        return { data: table === "public_profiles" ? ROW : null, error: null };
      },
      then: undefined as unknown,
    };
    // `await db.from(...).select("*")` precisa resolver como promise.
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: unknown) => unknown) => {
        anonReads.push(table);
        return Promise.resolve({ data: [ROW], error: null }).then(resolve);
      },
    });
    return chain;
  },
};

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: fakeDb,
}));

// Sem sessão: nenhuma conta logada (é o visitante que abre o link).
vi.mock("@/store/auth-store", () => ({
  currentAccount: () => null,
}));

describe("getPublicProfile sem sessão", () => {
  beforeEach(() => {
    anonReads.length = 0;
  });

  it("lê o perfil público pelo Supabase mesmo sem conta logada", async () => {
    const { getPublicProfile } = await import("@/services/profile-service");
    const profile = await getPublicProfile("joao-adrian");

    expect(anonReads).toContain("public_profiles");
    expect(profile?.profile.name).toBe("João Adrian");
    expect(profile?.handle).toBe("joao-adrian");
  });

  it("normaliza o handle recebido (@, caixa, acentos)", async () => {
    const { getPublicProfile } = await import("@/services/profile-service");
    const profile = await getPublicProfile("@João-Adrian");
    expect(profile?.handle).toBe("joao-adrian");
  });
});
