import { useEffect, useState } from "react";
import { KeyRound, Loader2, Save, ShieldQuestion } from "lucide-react";
import { myRecoverySecret, saveRecoverySecret, useAuth } from "@/hooks/use-auth";
import {
  RECOVERY_QUESTIONS,
  isPresetQuestion,
  isValidAnswer,
  isValidQuestion,
} from "@/lib/recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/config/parts";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Pergunta secreta na tela de Configurações: mostra a pergunta ativa e permite
// trocá-la. A resposta nunca volta do servidor — só é enviada quando salva.
// ---------------------------------------------------------------------------

export function RecoverySecretField() {
  const { account } = useAuth();
  const [current, setCurrent] = useState<{ set: boolean; question: string | null }>({
    set: false,
    question: null,
  });
  const [editing, setEditing] = useState(false);
  const [preset, setPreset] = useState<string>(RECOVERY_QUESTIONS[0]);
  const [custom, setCustom] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void myRecoverySecret().then((value) => {
      if (alive) setCurrent(value);
    });
    return () => {
      alive = false;
    };
  }, [account?.id]);

  const chosen = custom.trim() || preset;

  const startEditing = () => {
    const isPreset = current.question !== null && isPresetQuestion(current.question);
    setPreset(isPreset ? (current.question as string) : "");
    setCustom(!isPreset ? (current.question ?? "") : "");
    setAnswer("");
    setEditing(true);
  };

  const save = async () => {
    if (!isValidQuestion(chosen)) {
      toast.error("Escolha uma pergunta secreta (ou escreva a sua).");
      return;
    }
    if (!isValidAnswer(answer)) {
      toast.error("A resposta secreta precisa de ao menos 2 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveRecoverySecret(chosen, answer);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCurrent({ set: true, question: chosen });
      setEditing(false);
      setAnswer("");
      toast.success("Pergunta secreta salva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!editing ? (
        <>
          <div className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/30 px-3.5 py-3">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                {current.set ? "Pergunta ativa" : "Nenhuma pergunta cadastrada"}
              </p>
              <p className="mt-1 text-sm text-foreground">
                {current.set ? current.question : "Sem isso, não há como recuperar a senha."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <ShieldQuestion className="size-3.5" />
            {current.set ? "Trocar pergunta secreta" : "Definir pergunta secreta"}
          </Button>
        </>
      ) : (
        <>
          <Field label="Pergunta secreta">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {RECOVERY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value="">Escrever a minha própria…</option>
            </select>
          </Field>
          {preset === "" && (
            <Field label="Sua pergunta">
              <Input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Ex.: Qual o nome da minha primeira rua?"
              />
            </Field>
          )}
          <Field label="Resposta secreta">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Algo que você não esquece"
              autoComplete="off"
            />
          </Field>
          <p className="text-xs leading-5 text-faint">
            Maiúsculas, acentos e espaços não importam na hora de responder.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Salvar pergunta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setAnswer("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
