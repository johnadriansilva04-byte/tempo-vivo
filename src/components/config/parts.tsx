import type { ReactNode } from "react";
import { Cloud, HardDrive } from "lucide-react";
import { Label } from "@/components/ui/label";
import { LifetimeTracker } from "@/components/lifetime-tracker";
import { computeLifetime } from "@/hooks/use-lifetime";
import { isSupabaseConfigured } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Peças de apoio da página de Configurações: campo rotulado, indicador de onde
// a história está guardada e o preview do Memento Mori.
// ---------------------------------------------------------------------------

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-faint">{label}</Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pergunta secreta na tela de Configurações: mostra a pergunta ativa e permite
// trocá-la. A resposta nunca volta do servidor — só é enviada quando salva.
// ---------------------------------------------------------------------------
/**
 * Deixa visível ONDE a história está guardada.
 *
 * Sem isso o app trocava de modo em silêncio: ao configurar o Supabase ele passa
 * a gravar na nuvem, e sem credenciais volta a gravar só neste navegador — sem a
 * pessoa perceber. Como o modo local não sincroniza entre aparelhos, saber em
 * qual deles você está é o que evita achar que a história sumiu.
 */
export function StorageModeNotice() {
  const remote = isSupabaseConfigured;
  return (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 ${
        remote ? "border-border bg-card" : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        {remote ? (
          <>
            <Cloud className="size-4 text-primary" /> Sincronizado na nuvem
          </>
        ) : (
          <>
            <HardDrive className="size-4 text-amber-500" /> Somente neste navegador
          </>
        )}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {remote
          ? "Sua história fica na sua conta e aparece em qualquer aparelho onde você entrar."
          : "O Supabase não está configurado, então a história fica guardada apenas neste navegador e não aparece em outros aparelhos. Entre com o mesmo telefone e senha no mesmo navegador para retomar."}
      </p>
    </div>
  );
}

export function PreviewLifetime({
  birth_date,
  target_lifespan,
}: {
  birth_date: string;
  target_lifespan: number;
}) {
  const life = computeLifetime(birth_date, target_lifespan);
  if (!life.hasBirthDate) {
    return (
      <p className="text-xs text-faint">
        Informe uma data de nascimento válida para ver o Memento Mori.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <div className="size-20 shrink-0 rounded-full border border-border bg-muted p-2">
        <LifetimeTracker compact />
      </div>
      <div className="text-xs">
        <p className="font-semibold text-foreground">
          {life.age} anos · {life.pctConsumed.toFixed(1)}% de {target_lifespan}
        </p>
        <p className="text-muted-foreground">
          Ciclo {life.cycleIndex + 1} · {life.cycleName}
        </p>
      </div>
    </div>
  );
}
