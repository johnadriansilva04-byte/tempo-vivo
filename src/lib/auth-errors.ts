/**
 * Traduz falhas do Supabase Auth em algo que a pessoa entende. O serviço devolve
 * mensagens técnicas ("HTTP 502", "Failed to fetch", erro de JWT); mostrar isso
 * cru num formulário de cadastro mais assusta que orienta.
 */

const NETWORK_HINTS = [
  "failed to fetch",
  "networkerror",
  "network error",
  "http 5",
  "load failed",
  "err_connection",
  "timeout",
  "timed out",
];

const GENERIC = "Não conseguimos falar com o servidor. Verifique a conexão e tente de novo.";

/** Falha de transporte/serviço — não é credencial errada nem conta inexistente. */
export function isTransientAuthError(message: string | undefined | null): boolean {
  const lower = (message ?? "").trim().toLowerCase();
  if (!lower) return true;
  return NETWORK_HINTS.some((hint) => lower.includes(hint));
}

export function friendlyAuthError(message: string | undefined | null): string {
  const raw = (message ?? "").trim();
  if (!raw) return GENERIC;

  const lower = raw.toLowerCase();
  if (isTransientAuthError(raw)) return GENERIC;

  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Telefone ou senha não conferem.";
  }
  if (lower.includes("password should be") || lower.includes("password is too short")) {
    return "A senha é curta demais. Use pelo menos 4 caracteres.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Muitas tentativas seguidas. Aguarde um instante e tente de novo.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme a conta antes de entrar.";
  }
  if (lower.includes("jwt") || lower.includes("token has expired")) {
    return "Sua sessão expirou. Entre novamente.";
  }

  return raw;
}
