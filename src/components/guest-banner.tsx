import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveAccountDialog } from "@/components/auth/save-account-dialog";
import { useAuth } from "@/hooks/use-auth";

/**
 * Faixa do modo convidado, no topo do conteúdo.
 *
 * Explica que a sessão é descartável e oferece o caminho de saída: criar a
 * conta de verdade, sem perder o que já foi feito. Só aparece para convidado.
 */
export function GuestBanner() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);

  if (account?.is_guest !== true) return null;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-foreground/90">
          <UserRoundPlus className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            <strong>Você está como convidado.</strong> O que você fizer fica só
            neste navegador. Crie uma conta para guardar de verdade.
          </span>
        </p>
        <Button
          size="sm"
          className="shrink-0 self-start sm:self-auto"
          onClick={() => setOpen(true)}
        >
          Criar minha conta
        </Button>
      </div>
      <SaveAccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
