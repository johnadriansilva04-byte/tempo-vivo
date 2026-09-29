import { describe, expect, it, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// O aplicativo não pode reabrir o cadastro na cara de quem já tem conta.
//
// Bug original: todo retorno ao app abria em "criar conta"; quem já tinha conta
// precisava apertar "voltar" e o cadastro reabria de novo. A regra agora é:
// o app abre SEMPRE no login; quem nunca usou escolhe "Criar conta" com um toque.
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

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

describe("modo de entrada lembrado", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", { localStorage: makeStorage() });
  });

  it("primeira visita abre no login, nunca no cadastro", async () => {
    const store = await import("@/store/auth-store");
    expect(store.resumeLastMode()).toBe("entrar");
  });

  it("depois de entrar, o retorno abre no login", async () => {
    const store = await import("@/store/auth-store");
    store.rememberMode("entrar");
    expect(store.resumeLastMode()).toBe("entrar");
  });

  it("voltar manualmente ao cadastro também é lembrado", async () => {
    const store = await import("@/store/auth-store");
    store.rememberMode("entrar");
    store.rememberMode("criar");
    expect(store.resumeLastMode()).toBe("criar");
  });

  it("valor inválido no storage não quebra — cai no login", async () => {
    window.localStorage.setItem("perfil-vivo:auth:last-mode", "lixo");
    const store = await import("@/store/auth-store");
    expect(store.resumeLastMode()).toBe("entrar");
  });

  it("com sessão salva e sem modo lembrado, abre no login", async () => {
    // Alguém que já entrou mas veio de uma versão antiga (ou limpou o modo):
    // a sessão persistida basta para abrir no login, não no cadastro.
    window.localStorage.setItem(
      "perfil-vivo:auth:v1",
      JSON.stringify({ accounts: [], session: { user_id: "u1" } }),
    );
    const store = await import("@/store/auth-store");
    expect(store.resumeLastMode()).toBe("entrar");
  });
});
