import { AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { useSupabaseHealth } from "@/hooks/use-supabase-health";
import { isSupabaseConfigured } from "@/lib/supabase";

export function SupabaseHealthBanner() {
  const { health } = useSupabaseHealth();
  if (isSupabaseConfigured && health === "ok") return null;
  if (!isSupabaseConfigured) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5">
        <Database className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-amber-900 dark:text-amber-200">
          <strong>Modo local</strong> — sem banco. Seus dados ficam no
          navegador. Configure{" "}
          <code className="rounded bg-amber-500/20 px-1">
            VITE_SUPABASE_URL
          </code>{" "}
          e{" "}
          <code className="rounded bg-amber-500/20 px-1">
            VITE_SUPABASE_ANON_KEY
          </code>{" "}
          para persistir no Supabase.{" "}
          <a href="/configuracoes" className="underline underline-offset-2">
            Ver instruções
          </a>
          .
        </p>
      </div>
    );
  }
  if (health === "offline") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs leading-5">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
        <p className="text-destructive">
          <strong>Sem conexão com o banco.</strong> Você está no modo local até
          a conexão voltar.
        </p>
      </div>
    );
  }
  return null;
}
