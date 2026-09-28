import { PostgrestError } from "@supabase/supabase-js";

export type ApiErrorCode =
  | "NOT_CONFIGURED"
  | "NETWORK"
  | "TIMEOUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LOCKED" // 24h temporal-lock
  | "VALIDATION"
  | "RATE_LIMITED"
  | "UNKNOWN";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly cause_: unknown;
  constructor(code: ApiErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.cause_ = cause;
  }
}

const PG_CODE_MAP: Record<string, ApiErrorCode> = {
  "23505": "CONFLICT",
  "23503": "CONFLICT",
  "23514": "VALIDATION",
  P0001: "LOCKED", // nossa trigger enforce_daily_log_temporal_integrity
  "42501": "FORBIDDEN",
};

export function mapSupabaseError(err: PostgrestError): ApiError {
  const pgMapped = PG_CODE_MAP[err.code ?? ""];
  if (pgMapped)
    return new ApiError(pgMapped, humanMessage(err.message, pgMapped), err);
  const msg = (err.message ?? "").toLowerCase();
  if (msg.includes("jwt") || msg.includes("not authenticated"))
    return new ApiError(
      "UNAUTHENTICATED",
      "Sessão expirada. Faça login novamente.",
      err,
    );
  if (err.code === "PGRST116")
    return new ApiError("NOT_FOUND", "Registro não encontrado.", err);
  return new ApiError(
    "UNKNOWN",
    err.message || "Erro inesperado ao falar com o banco.",
    err,
  );
}

export function mapUnknownError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return new ApiError(
      "NETWORK",
      "Sem conexão. Tente novamente em instantes.",
      err,
    );
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return new ApiError("TIMEOUT", "Tempo esgotado ao falar com o banco.", err);
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err
  ) {
    return mapSupabaseError(err as PostgrestError);
  }
  const msg =
    err instanceof Error ? err.message : String(err ?? "Erro desconhecido");
  return new ApiError("UNKNOWN", msg, err);
}

function humanMessage(pgMessage: string, code: ApiErrorCode): string {
  if (code === "LOCKED")
    return pgMessage || "Este dia foi travado (24 h) e não pode ser alterado.";
  if (code === "CONFLICT")
    return "Registro duplicado — já existe um item com esses dados.";
  if (code === "VALIDATION") return pgMessage || "Dados inválidos.";
  if (code === "FORBIDDEN") return "Sem permissão para esta operação.";
  return pgMessage;
}

/** Indica se o erro é transitório (rede/timeout) — usado para decidir retentativas. */
export function isTransientErrorCode(code: ApiErrorCode | undefined): boolean {
  return code === "NETWORK" || code === "TIMEOUT";
}
