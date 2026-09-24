import { describe, expect, it } from "vitest";
import { friendlyAuthError, isTransientAuthError } from "./auth-errors";

describe("isTransientAuthError", () => {
  it("trata falha de rede e erro 5xx como transitórios", () => {
    expect(isTransientAuthError("Failed to fetch")).toBe(true);
    expect(isTransientAuthError("HTTP 502")).toBe(true);
    expect(isTransientAuthError("NetworkError when attempting to fetch resource.")).toBe(true);
    expect(isTransientAuthError("")).toBe(true);
    expect(isTransientAuthError(undefined)).toBe(true);
  });

  it("não confunde credencial errada com falha de rede", () => {
    expect(isTransientAuthError("Invalid login credentials")).toBe(false);
    expect(isTransientAuthError("User already registered")).toBe(false);
  });
});

describe("friendlyAuthError", () => {
  it("nunca devolve o erro técnico cru para falha de conexão", () => {
    const message = friendlyAuthError("HTTP 502");
    expect(message).not.toMatch(/502|HTTP/i);
    expect(message).toMatch(/conexão/i);
  });

  it("traduz credencial inválida", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe("Telefone ou senha não conferem.");
  });

  it("traduz limite de tentativas", () => {
    expect(friendlyAuthError("email rate limit exceeded")).toMatch(/tentativas/i);
  });

  it("explica senha curta", () => {
    expect(friendlyAuthError("Password should be at least 6 characters")).toMatch(/curta/i);
  });

  it("preserva mensagens que já são úteis", () => {
    expect(friendlyAuthError("Falha ao criar o perfil.")).toBe("Falha ao criar o perfil.");
  });
});
