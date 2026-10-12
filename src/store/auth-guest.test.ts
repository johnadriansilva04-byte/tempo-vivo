import { describe, expect, it, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Sessão de convidado.
//
// Entrada rápida, sem cadastro, que serve para conhecer o app. Regras que não
// podem regredir:
// - o convidado é marcado com `is_guest` (nunca se passa por uma conta real);
// - a sessão é restaurada ao reabrir o app, mesmo com Supabase configurado;
// - sair descarta o convidado;
// - entrar com uma conta real substitui o convidado.
// ---------------------------------------------------------------------------

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

const GUEST_KEY = "perfil-vivo:auth:guest";

describe("modo convidado (sem Supabase)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", { localStorage: makeStorage() });
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: false,
      supabase: null,
    }));
  });

  it("cria uma sessão marcada como convidado", async () => {
    const store = await import("@/store/auth-store");
    const result = store.signInAsGuest();
    expect(result.ok).toBe(true);
    expect(result.account.is_guest).toBe(true);
    expect(result.account.name).toBe("Convidado");
    expect(result.account.phone).toBe("");
  });

  it("reaproveita a mesma sessão ao entrar de novo como convidado", async () => {
    const store = await import("@/store/auth-store");
    const first = store.signInAsGuest();
    const second = store.signInAsGuest();
    expect(second.account.id).toBe(first.account.id);
  });

  it("restaura o convidado ao reabrir o app", async () => {
    const store = await import("@/store/auth-store");
    store.signInAsGuest();
    vi.resetModules();
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: false,
      supabase: null,
    }));
    const reopened = await import("@/store/auth-store");
    reopened.initAuth();
    expect(reopened.getSnapshot().ready).toBe(true);
    expect(reopened.getSnapshot().account?.is_guest).toBe(true);
  });

  it("sair descarta a sessão de convidado", async () => {
    const store = await import("@/store/auth-store");
    store.signInAsGuest();
    await store.signOut();
    expect(store.getSnapshot().account).toBeNull();
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
  });
});

describe("modo convidado (com Supabase)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", { localStorage: makeStorage() });
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe() {} } },
          }),
          signOut: async () => ({ error: null }),
        },
      },
    }));
  });

  it("restaura o convidado sem esperar a rede do Supabase", async () => {
    const store = await import("@/store/auth-store");
    store.signInAsGuest();
    vi.resetModules();
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getSession: async () => ({ data: { session: null } }),
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe() {} } },
          }),
        },
      },
    }));
    const reopened = await import("@/store/auth-store");
    reopened.initAuth();
    // Síncrono: o convidado não passa pelo "Retomando sua sessão…".
    expect(reopened.getSnapshot().ready).toBe(true);
    expect(reopened.getSnapshot().account?.is_guest).toBe(true);
  });
});
