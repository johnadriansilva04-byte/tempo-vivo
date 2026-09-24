import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

// Servir a página por HTTPS e apontar para um Supabase em http:// faz o
// navegador bloquear as chamadas (mixed content) e a sessão nunca carrega.
// Nesse caso passamos pelo proxy do dev server, que expõe o Supabase na
// mesma origem. Em produção use uma URL https:// de verdade.
function resolveUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    raw.startsWith("http://")
  ) {
    return `${window.location.origin}/supabase`;
  }
  return raw;
}

const effectiveUrl = resolveUrl(url);

export const isSupabaseConfigured = Boolean(effectiveUrl && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(effectiveUrl as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
