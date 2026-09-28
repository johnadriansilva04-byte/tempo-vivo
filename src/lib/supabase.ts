import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError, mapUnknownError } from "@/lib/api-errors";
import type { Database } from "@/lib/database.types";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: { schema: "public" },
    })
  : null;

export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase)
    throw new ApiError(
      "NOT_CONFIGURED",
      "Supabase não configurado — usando modo local.",
    );
  return supabase;
}

export async function checkSupabaseHealth(): Promise<
  "ok" | "offline" | "not-configured"
> {
  if (!isSupabaseConfigured || !supabase) return "not-configured";
  try {
    const { error } = await (supabase as unknown as SupabaseClient)
      .from("profiles")
      .select("id")
      .limit(1);
    if (error) throw error;
    return "ok";
  } catch (e) {
    const mapped = mapUnknownError(e);
    if (mapped.code === "NETWORK" || mapped.code === "TIMEOUT")
      return "offline";
    return "ok";
  }
}

/** Retry apenas para falhas transitórias de rede. Aceita PostgrestBuilder (thenable). */
export async function withRetry<T>(
  fn: () => PromiseLike<T>,
  attempts = 2,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const mapped = mapUnknownError(e);
      const transient = mapped.code === "NETWORK" || mapped.code === "TIMEOUT";
      if (!transient || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw last as Error;
}

// Enable Realtime for specific tables
export function enableRealtime() {
  if (!supabase) return;

  try {
    // Enable realtime for daily_logs
    supabase
      .channel("daily_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs" },
        () => undefined,
      )
      .subscribe();

    // Enable realtime for profiles
    supabase
      .channel("profile_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => undefined,
      )
      .subscribe();
  } catch (error) {
    console.error("Error enabling realtime:", error);
  }
}
