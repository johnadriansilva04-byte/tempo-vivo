import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthError } from "@/components/auth/form";
import { SignUpForm } from "@/components/auth/signup-form";
import { useSignupDraft } from "@/components/auth/use-signup-draft";
import { signUp, useAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Salvar a conta do convidado.
//
// O convidado já usou o app e não quer perder o que fez. Aqui ele só completa
// os dados que faltam (telefone, senha, pergunta secreta) e a sessão deixa de
// ser descartável. O cadastro é o MESMO da tela de entrada — este diálogo só
// embrulha o `SignUpForm` para não duplicar campos nem validação.
//
// Os dados locais (agenda, projetos) não mudam de lugar: continuam no mesmo
// navegador. O que muda é que a conta passa a existir de verdade.
// ---------------------------------------------------------------------------

export function SaveAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { account } = useAuth();
  const draft = useSignupDraft();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reaproveita o nome que o convidado já tinha (se não for o rótulo padrão).
  useEffect(() => {
    if (!open) return;
    setError(null);
    draft.setStep("identity");
    const existing = account?.name?.trim() ?? "";
    if (existing && existing !== "Convidado") draft.setName(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      if (draft.password !== draft.confirm) {
        setError("As senhas não conferem.");
        return;
      }
      const result = await signUp({
        name: draft.name,
        age: Number(draft.age),
        phone: draft.phone,
        password: draft.password,
        recovery_question: draft.chosenQuestion,
        recovery_answer: draft.answer,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      draft.reset();
      onOpenChange(false);
      toast.success("Conta criada. Agora seus dados ficam guardados.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar minha conta</DialogTitle>
          <DialogDescription>
            Complete seus dados para guardar o que você já fez. Leva um minuto.
          </DialogDescription>
        </DialogHeader>

        <SignUpForm
          draft={draft}
          pending={pending}
          onSubmit={() => void submit()}
          hideHeading
        />
        {error && <AuthError message={error} />}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Continuar como convidado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
