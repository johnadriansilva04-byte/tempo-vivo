import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Mission, ProjectPhase } from "@/types/projects";

type PhaseDraft = {
  title: string;
  objective: string;
  description: string;
  instructions: string;
  criteria: string;
  subtasks: string;
  executed_text: string;
  result_text: string;
  observations: string;
  next_step: string;
};

function Preview({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Etapa de confirmação antes de congelar o registro da fase. Mostra a prévia do
 * que será arquivado e exige confirmação explícita.
 */
export function ConfirmPhaseDialog({
  open,
  phase,
  draft,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  phase: ProjectPhase;
  draft: PhaseDraft;
  onOpenChange: (open: boolean) => void;
  onConfirm: (final: {
    executed: string;
    result: string;
    observations: string;
    next_step: string;
  }) => void;
}) {
  const [executed, setExecuted] = useState(draft.executed_text);
  const [result, setResult] = useState(draft.result_text);
  const [observations, setObservations] = useState(draft.observations);
  const [nextStep, setNextStep] = useState(draft.next_step);

  useEffect(() => {
    if (open) {
      setExecuted(draft.executed_text);
      setResult(draft.result_text);
      setObservations(draft.observations);
      setNextStep(draft.next_step);
    }
  }, [
    open,
    draft.executed_text,
    draft.result_text,
    draft.observations,
    draft.next_step,
  ]);

  const completedAt = new Date().toLocaleString("pt-BR");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Confirmar conclusão da Fase {phase.position}
          </DialogTitle>
          <DialogDescription>
            Revise o registro que será congelado. Depois de confirmado, ele não
            poderá ser editado nem apagado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              <ShieldCheck className="size-3.5" /> Prévia do registro
            </p>
            <div className="space-y-3">
              <Preview
                label="Título"
                value={`Fase ${phase.position} — ${draft.title}`}
              />
              <Preview
                label="Descrição da atividade"
                value={draft.description}
              />
              <Preview label="Tarefas registradas" value={draft.subtasks} />
              <Preview label="Data e hora da conclusão" value={completedAt} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>O que foi executado</Label>
            <Textarea
              value={executed}
              onChange={(e) => setExecuted(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Resultado obtido</Label>
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observações finais</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Próximo passo</Label>
            <Textarea
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                executed,
                result,
                observations,
                next_step: nextStep,
              })
            }
          >
            Confirmar conclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmação de conclusão de missão — registra resumo, resultado, observações,
 * anexos e próximo passo antes de congelar.
 */
export function ConfirmMissionDialog({
  open,
  mission,
  onOpenChange,
  onConfirm,
  children,
}: {
  open: boolean;
  mission: Mission;
  onOpenChange: (open: boolean) => void;
  onConfirm: (final: {
    summary: string;
    result: string;
    observations: string;
    next_step: string;
  }) => void;
  children?: React.ReactNode;
}) {
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState("");
  const [observations, setObservations] = useState("");
  const [nextStep, setNextStep] = useState("");

  const completedAt = new Date().toLocaleString("pt-BR");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar conclusão — {mission.title}</DialogTitle>
          <DialogDescription>
            Revise o registro final. Depois de confirmado, ele se torna
            imutável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              <ShieldCheck className="size-3.5" /> Prévia do registro
            </p>
            <div className="space-y-3">
              <Preview label="Missão" value={mission.title} />
              <Preview label="Objetivo" value={mission.objective} />
              <Preview label="Data e hora da conclusão" value={completedAt} />
            </div>
          </div>

          {children}

          <div className="space-y-1.5">
            <Label>Resumo do que foi executado</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Resultado alcançado</Label>
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observações finais</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Próximo passo</Label>
            <Textarea
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                summary,
                result,
                observations,
                next_step: nextStep,
              })
            }
          >
            Confirmar conclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
