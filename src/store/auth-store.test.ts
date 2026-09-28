import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// O app não pode ficar preso em "Retomando sua sessão…" na primeira carga.
//
// Na primeira visita o supabase-js tenta renovar o token pela rede (cold
// start) e `getSession()` pode rejeitar por timeout. Antes essa rejeição
// escapava do try/catch e `ready` nunca virava true: a tela ficava girando até
// um F5, quando o token já estava em cache e resolvia rápido. Este teste trava
// essa regressão.
// ---------------------------------------------------------------------------

const getSession = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
    from: (...args: unknown[]) => from(...args),
  },
}));

beforeEach(() => {
  vi.resetModules();
  getSession.mockReset();
  from.mockReset();
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    localStorage: { getItem: () => null, setItem: () => {} },
  });
});

describe("initAuth no primeiro acesso", () => {
  it("libera a tela quando getSession falha por rede", async () => {
    getSession.mockRejectedValue(new Error("getSession: tempo esgotado"));
    const store = await import("@/store/auth-store");

    store.initAuth();

    await vi.waitFor(() => expect(store.getSnapshot().ready).toBe(true));
    expect(store.getSnapshot().account).toBeNull();
  });

  it("libera a tela quando getSession rejeita de forma inesperada", async () => {
    getSession.mockRejectedValue(new Error("falha inesperada"));
    const store = await import("@/store/auth-store");

    store.initAuth();

    await vi.waitFor(() => expect(store.getSnapshot().ready).toBe(true));
  });

  it("mantém a sessão quando a leitura do perfil falha", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: new Error("rede") }),
        }),
      }),
    });
    const store = await import("@/store/auth-store");

    store.initAuth();

    await vi.waitFor(() => expect(store.getSnapshot().ready).toBe(true));
  });
});
