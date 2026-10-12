import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// O convidado nunca grava no Supabase.
//
// A sessão de convidado não tem identidade no banco; gravar com o id do
// convidado violaria as políticas de RLS. A regra é: sem Supabase → local;
// com Supabase e conta real → banco; com Supabase e convidado → local.
// ---------------------------------------------------------------------------

async function load(configured: boolean, account: unknown) {
  vi.resetModules();
  vi.doMock("@/lib/supabase", () => ({ isSupabaseConfigured: configured }));
  vi.doMock("@/store/auth-store", () => ({ currentAccount: () => account }));
  return import("@/lib/data-mode");
}

describe("isLocalMode", () => {
  beforeEach(() => vi.resetModules());

  it("sem Supabase configurado, tudo é local", async () => {
    const { isLocalMode } = await load(false, null);
    expect(isLocalMode()).toBe(true);
  });

  it("com Supabase e conta real, usa o banco", async () => {
    const { isLocalMode } = await load(true, { id: "u1" });
    expect(isLocalMode()).toBe(false);
  });

  it("com Supabase e convidado, força o modo local", async () => {
    const { isLocalMode } = await load(true, { id: "convidado-1", is_guest: true });
    expect(isLocalMode()).toBe(true);
  });

  it("com Supabase e ninguém logado, ainda é remoto (páginas públicas)", async () => {
    // Visitante anônimo do link público (/u/:slug) não é convidado: precisa
    // ler o perfil no Supabase, não no armazenamento local.
    const { isLocalMode } = await load(true, null);
    expect(isLocalMode()).toBe(false);
  });
});
