import { useEffect, useState } from "react";
import { Lock, Play, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentList } from "@/components/projects/attachment-list";
import { AttachmentUploader } from "@/components/projects/attachment-uploader";
import { ConfirmPhaseDialog } from "@/components/projects/confirm-dialogs";
import { SnapshotView } from "@/components/projects/snapshot-view";
import { formatDateTime, phaseStatusBadge } from "@/components/projects/status";
import {
  useConcludePhase,
  useDeleteAttachment,
  useDeletePhase,
  useStartPhase,
  useUpdatePhase,
} from "@/hooks/use-projects";
import type {
  PhaseCompletionRecord,
  ProjectAttachment,
  ProjectPhase,
} from "@/types/projects";

type Draft = {
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

function draftFrom(phase: ProjectPhase): Draft {
  return {
    title: phase.title,
    objective: phase.objective,
    description: phase.description,
    instructions: phase.instructions,
    criteria: phase.criteria,
    subtasks: phase.subtasks.join("\n"),
    executed_text: phase.executed_text,
    result_text: phase.result_text,
    observations: phase.observations,
    next_step: phase.next_step,
  };
}

/**
 * Tela de execução de uma fase. Enquanto aberta, o planejamento é editável.
 * Depois de concluída, mostra o registro congelado — sem edição, sem exclusão.
 */
export function PhaseEditor({
  projectId,
  phase,
  record,
  attachments,
  open,
  onOpenChange,
}: {
  projectId: string;
  phase: ProjectPhase;
  record: PhaseCompletionRecord | null;
  attachments: ProjectAttachment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(phase));
  const [confirming, setConfirming] = useState(false);

  const updatePhase = useUpdatePhase(projectId);
  const startPhase = useStartPhase(projectId);
  const concludePhase = useConcludePhase(projectId);
  const deletePhase = useDeletePhase(projectId);
  const deleteAttachment = useDeleteAttachment(projectId);

  // Recarrega o rascunho só ao trocar de fase. Não dependemos de `status` nem de
  // `updated_at` para não apagar texto ainda não salvo quando o usuário inicia
  // ou salva a fase.
  useEffect(() => {
    setDraft(draftFrom(phase));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id]);

  const frozen = phase.status === "concluida";
  const blocked = phase.status === "bloqueada";
  const badge = phaseStatusBadge(phase.status);
  const phaseAttachments = attachments.filter((a) => a.phase_id === phase.id);

  const save = async () => {
    if (draft.title.trim() === "") {
      toast.error("A fase precisa de um título.");
      return;
    }
    try {
      await updatePhase.mutateAsync({
        phaseId: phase.id,
        patch: {
          title: draft.title.trim(),
          objective: draft.objective,
          description: draft.description,
          instructions: draft.instructions,
          criteria: draft.criteria,
          subtasks: draft.subtasks
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          executed_text: draft.executed_text,
          result_text: draft.result_text,
          observations: draft.observations,
          next_step: draft.next_step,
        },
      });
      toast.success("Planejamento salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const start = async () => {
    try {
      await startPhase.mutateAsync(phase.id);
      toast.success("Fase iniciada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao iniciar.");
    }
  };

  const remove = async () => {
    if (!window.confirm("Remover esta fase? Ela ainda não foi concluída."))
      return;
    try {
      await deletePhase.mutateAsync(phase.id);
      toast.success("Fase removida.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover.");
    }
  };

  const confirmConclusion = async (final: {
    executed: string;
    result: string;
    observations: string;
    next_step: string;
  }) => {
    try {
      // Persiste o planejamento atual antes de congelar, para o registro
      // arquivado ser exatamente o que foi exibido na prévia da confirmação.
      await updatePhase.mutateAsync({
        phaseId: phase.id,
        patch: {
          title: draft.title.trim(),
          objective: draft.objective,
          description: draft.description,
          instructions: draft.instructions,
          criteria: draft.criteria,
          subtasks: draft.subtasks
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          executed_text: final.executed,
          result_text: final.result,
          observations: final.observations,
          next_step: final.next_step,
        },
      });
      await concludePhase.mutateAsync({ phaseId: phase.id, final });
      toast.success("Fase concluída e arquivada.");
      setConfirming(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao concluir.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-display">
                Fase {phase.position} — {phase.title}
              </span>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span className={badge.className}>{badge.label}</span>
              {frozen && record && (
                <span className="text-xs text-faint">
                  Arquivada em {formatDateTime(record.completed_at)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {frozen ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                  <Lock className="size-3.5" /> Registro protegido — não pode
                  ser editado nem apagado
                </p>
                {record ? (
                  <SnapshotView snapshot={record.final_snapshot} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Registro de conclusão indisponível.
                  </p>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-display text-sm font-semibold">
                  Documentos no registro
                </h4>
                <AttachmentList attachments={phaseAttachments} frozen />
              </div>
            </div>
          ) : blocked ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Esta fase está bloqueada. Conclua a fase anterior para poder
                executá-la.
              </div>
              <Field label="Título">
                <Input value={draft.title} readOnly />
              </Field>
              {phase.objective && (
                <Field label="Objetivo">
                  <p className="text-sm text-foreground">{phase.objective}</p>
                </Field>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Título da fase">
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </Field>
              <Field label="Objetivo">
                <Textarea
                  value={draft.objective}
                  onChange={(e) =>
                    setDraft({ ...draft, objective: e.target.value })
                  }
                />
              </Field>
              <Field label="Descrição da tarefa">
                <Textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Instruções">
                <Textarea
                  value={draft.instructions}
                  onChange={(e) =>
                    setDraft({ ...draft, instructions: e.target.value })
                  }
                />
              </Field>
              <Field label="Subtarefas (uma por linha)">
                <Textarea
                  value={draft.subtasks}
                  onChange={(e) =>
                    setDraft({ ...draft, subtasks: e.target.value })
                  }
                />
              </Field>
              <Field label="Critérios de conclusão">
                <Textarea
                  value={draft.criteria}
                  onChange={(e) =>
                    setDraft({ ...draft, criteria: e.target.value })
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="O que foi executado">
                  <Textarea
                    value={draft.executed_text}
                    onChange={(e) =>
                      setDraft({ ...draft, executed_text: e.target.value })
                    }
                  />
                </Field>
                <Field label="Resultado obtido">
                  <Textarea
                    value={draft.result_text}
                    onChange={(e) =>
                      setDraft({ ...draft, result_text: e.target.value })
                    }
                  />
                </Field>
                <Field label="Observações">
                  <Textarea
                    value={draft.observations}
                    onChange={(e) =>
                      setDraft({ ...draft, observations: e.target.value })
                    }
                  />
                </Field>
                <Field label="Próximo passo">
                  <Textarea
                    value={draft.next_step}
                    onChange={(e) =>
                      setDraft({ ...draft, next_step: e.target.value })
                    }
                  />
                </Field>
              </div>

              <div>
                <h4 className="mb-2 font-display text-sm font-semibold">
                  Documentos e referências
                </h4>
                <AttachmentList
                  attachments={phaseAttachments}
                  frozen={false}
                  onDelete={(id) =>
                    void deleteAttachment
                      .mutateAsync(id)
                      .then(() => toast.success("Anexo removido."))
                      .catch((e) =>
                        toast.error(
                          e instanceof Error ? e.message : "Falha ao remover.",
                        ),
                      )
                  }
                />
                <div className="mt-3">
                  <AttachmentUploader
                    projectId={projectId}
                    phaseId={phase.id}
                    onUploaded={() => undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {!frozen && !blocked && (
            <DialogFooter className="flex-wrap gap-2 sm:justify-between">
              <Button type="button" variant="ghost" onClick={remove}>
                <Trash2 className="size-3.5 text-destructive" /> Remover
              </Button>
              <div className="flex flex-wrap gap-2">
                {phase.status === "disponivel" && (
                  <Button type="button" variant="outline" onClick={start}>
                    <Play className="size-3.5" /> Iniciar fase
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={save}>
                  <Save className="size-3.5" /> Salvar
                </Button>
                <Button type="button" onClick={() => setConfirming(true)}>
                  Concluir fase
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmPhaseDialog
        open={confirming}
        phase={phase}
        draft={draft}
        onOpenChange={setConfirming}
        onConfirm={confirmConclusion}
      />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </Label>
      {children}
    </div>
  );
}
