// Leitura direta do id da conta logada, sem importar o store de autenticação
// (evita ciclo entre `auth-store` e `profile-repository`).
const AUTH_KEY = "perfil-vivo:auth:v1";

export function currentLocalUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { session?: { user_id?: string } | null };
    return parsed.session?.user_id ?? null;
  } catch {
    return null;
  }
}
