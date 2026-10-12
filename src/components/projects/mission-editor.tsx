import { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  History,
  Lock,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
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
import { ConfirmMissionDialog } from "@/components/projects/confirm-dialogs";
import { SnapshotView } from "@/components/projects/snapshot-view";
import {
  formatDateTime,
  missionStatusBadge,
} from "@/components/projects/status";
import {
  useAddMissionComplement,
  useAddMissionDependency,
  useConcludeMission,
  useCreateMission,
  useDeleteAttachment,
  useDeleteMission,
  usePauseMission,
  useResumeMission,
  useStartMission,
  useSubstituteMission,
  useUpdateMission,
} from "@/hooks/use-projects";
import type {
  Mission,
  MissionComplement,
  MissionCompletionRecord,
  MissionDependency,
  MissionVersion,
  ProjectAttachment,
  ProjectPhase,
} from "@/types/projects";

function versionContent(version: MissionVersion) {
  const s = version.complete_snapshot;
  return {
    title: String(s["title"] ?? ""),
    description: String(s["description"] ?? ""),
    context: String(s["context"] ?? ""),
    objective: String(s["objective"] ?? ""),
  };
}

/**
 * Editor de missão: criação, edição com versionamento, substituição explícita,
 * conclusão imutável, dependências, complementos, anexos e histórico de versões.
 */
export function MissionEditor({
  projectId,
  mission,
  phases,
  allMissions,
  dependencies,
  versions,
  complements,
  attachments,
  record,
  defaultPhaseId,
  open,
  onOpenChange,
}: {
  projectId: string;
  mission: Mission | null;
  phases: ProjectPhase[];
  allMissions: Mission[];
  dependencies: MissionDependency[];
  versions: MissionVersion[];
  complements: MissionComplement[];
  attachments: ProjectAttachment[];
  record: MissionCompletionRecord | null;
  defaultPhaseId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isNew = mission === null;
  const [title, setTitle] = useState(mission?.title ?? "");
  const [description, setDescription] = useState(mission?.description ?? "");
  const [context, setContext] = useState(mission?.context ?? "");
  const [objective, setObjective] = useState(mission?.objective ?? "");
  const [phaseId, setPhaseId] = useState<string>(
    mission?.phase_id ?? defaultPhaseId ?? "",
  );
  const [reason, setReason] = useState("");
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [substituting, setSubstituting] = useState(false);
  const [complement, setComplement] = useState("");
  const [complementReason, setComplementReason] = useState("");
  const [depId, setDepId] = useState("");

  const createMission = useCreateMission(projectId);
  const updateMission = useUpdateMission(projectId);
  const substituteMission = useSubstituteMission(projectId);
  const concludeMission = useConcludeMission(projectId);
  const deleteMission = useDeleteMission(projectId);
  const startMission = useStartMission(projectId);
  const pauseMission = usePauseMission(projectId);
  const resumeMission = useResumeMission(projectId);
  const addDependency = useAddMissionDependency(projectId);
  const addComplement = useAddMissionComplement(projectId);
  const deleteAttachment = useDeleteAttachment(projectId);

  // Só recarrega os campos ao abrir o editor ou trocar de missão. Depender do
  // objeto `mission` inteiro apagaria o que o usuário digitou a cada refetch.
  useEffect(() => {
    if (!open) return;
    setTitle(mission?.title ?? "");
    setDescription(mission?.description ?? "");
    setContext(mission?.context ?? "");
    setObjective(mission?.objective ?? "");
    setPhaseId(mission?.phase_id ?? defaultPhaseId ?? "");
    setReason("");
    setViewVersion(null);
    setSubstituting(false);
    setComplement("");
    setComplementReason("");
    setDepId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mission?.id, defaultPhaseId]);

  const frozen = mission
    ? mission.status === "concluida" || mission.status === "substituida"
    : false;
  const concluded = mission?.status === "concluida";
  const replaced = mission?.status === "substituida";

  const myDeps = useMemo(
    () =>
      mission ? dependencies.filter((d) => d.mission_id === mission.id) : [],
    [dependencies, mission],
  );
  const substitute = mission
    ? (allMissions.find((m) => m.replaces_mission_id === mission.id) ?? null)
    : null;
  const original = mission?.replaces_mission_id
    ? (allMissions.find((m) => m.id === mission.replaces_mission_id) ?? null)
    : null;

  const missionVersions = useMemo(
    () =>
      mission
        ? versions
            .filter((v) => v.mission_id === mission.id)
            .sort((a, b) => a.version_number - b.version_number)
        : [],
    [versions, mission],
  );
  const latestVersion = missionVersions[missionVersions.length - 1] ?? null;

  const save = async () => {
    if (title.trim() === "") {
      toast.error("A missão precisa de um título.");
      return;
    }
    try {
      if (isNew) {
        await createMission.mutateAsync({
          project_id: projectId,
          title: title.trim(),
          description,
          context,
          objective,
          phase_id: phaseId || null,
        });
        toast.success("Missão criada.");
      } else {
        await updateMission.mutateAsync({
          missionId: mission.id,
          patch: { title: title.trim(), description, context, objective },
          reason,
        });
        toast.success("Missão salva como nova versão.");
        setReason("");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const doSubstitute = async () => {
    if (!mission) return;
    if (title.trim() === "") {
      toast.error("A nova missão precisa de um título.");
      return;
    }
    try {
      await substituteMission.mutateAsync({
        missionId: mission.id,
        title: title.trim(),
        description,
        context,
        objective,
        reason,
      });
      toast.success("Missão substituída. A anterior permanece no histórico.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao substituir.");
    }
  };

  const doConclude = async (final: {
    summary: string;
    result: string;
    observations: string;
    next_step: string;
  }) => {
    if (!mission) return;
    try {
      await concludeMission.mutateAsync({ missionId: mission.id, final });
      toast.success("Missão concluída e arquivada.");
      setConfirming(false);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao concluir.");
    }
  };

  const doDelete = async () => {
    if (!mission) return;
    if (
      !window.confirm("Remover esta missão? Só rascunhos podem ser removidos.")
    )
      return;
    try {
      await deleteMission.mutateAsync(mission.id);
      toast.success("Missão removida.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover.");
    }
  };

  const doStart = async () => {
    if (!mission) return;
    try {
      await startMission.mutateAsync(mission.id);
      toast.success("Missão iniciada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao iniciar.");
    }
  };

  const doPause = async () => {
    if (!mission) return;
    try {
      await pauseMission.mutateAsync(mission.id);
      toast.success("Missão pausada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao pausar.");
    }
  };

  const doResume = async () => {
    if (!mission) return;
    try {
      await resumeMission.mutateAsync(mission.id);
      toast.success("Missão retomada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao retomar.");
    }
  };

  const doAddDependency = async () => {
    if (!mission || !depId) return;
    try {
      await addDependency.mutateAsync({
        missionId: mission.id,
        dependsOnMissionId: depId,
      });
      toast.success("Dependência registrada.");
      setDepId("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Falha ao registrar dependência.",
      );
    }
  };

  const doAddComplement = async () => {
    if (!mission || complement.trim() === "") return;
    try {
      await addComplement.mutateAsync({
        missionId: mission.id,
        content: complement,
        reason: complementReason,
      });
      toast.success("Registro complementar criado.");
      setComplement("");
      setComplementReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao complementar.");
    }
  };

  const badge = mission ? missionStatusBadge(mission.status) : null;
  const lifecycleAction =
    mission?.status === "em_andamento" ? (
      <Button type="button" variant="outline" onClick={doPause}>
        <Pause className="size-3.5" /> Pausar
      </Button>
    ) : mission?.status === "pausada" ? (
      <Button type="button" variant="outline" onClick={doResume}>
        <RotateCcw className="size-3.5" /> Retomar
      </Button>
    ) : mission?.status === "disponivel" ? (
      <Button type="button" variant="outline" onClick={doStart}>
        <Play className="size-3.5" /> Iniciar
      </Button>
    ) : null;
  const missionAttachments = mission
    ? attachments.filter((a) => a.mission_id === mission.id)
    : [];
  const viewedVersion =
    viewVersion !== null
      ? (missionVersions.find((v) => v.version_number === viewVersion) ?? null)
      : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nova missão" : mission.title}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {badge && <span className={badge.className}>{badge.label}</span>}
              {replaced && substitute && (
                <span className="text-xs text-primary">
                  Substituída pela missão “{substitute.title}”
                </span>
              )}
              {original && (
                <span className="text-xs text-faint">
                  Substitui “{original.title}”
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {concluded || replaced ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                  <Lock className="size-3.5" />
                  {concluded
                    ? "Registro protegido — não pode ser editado nem apagado"
                    : "Missão substituída — preservada no histórico"}
                </p>
                <SnapshotView
                  snapshot={
                    concluded && record
                      ? record.final_snapshot
                      : {
                          title: mission?.title ?? "",
                          description: mission?.description ?? "",
                          context: mission?.context ?? "",
                          objective: mission?.objective ?? "",
                        }
                  }
                />
              </div>

              {concluded && (
                <div>
                  <h4 className="mb-2 font-display text-sm font-semibold">
                    Documentos no registro
                  </h4>
                  <AttachmentList attachments={missionAttachments} frozen />
                </div>
              )}

              {concluded && (
                <ComplementSection
                  complements={complements.filter(
                    (c) => c.mission_id === mission?.id,
                  )}
                  content={complement}
                  reason={complementReason}
                  onContent={setComplement}
                  onReason={setComplementReason}
                  onAdd={doAddComplement}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {substituting && (
                <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-xs text-foreground">
                  Você está criando a missão que vai <strong>substituir</strong>{" "}
                  “{mission?.title}”. Informe o título e o conteúdo da nova
                  missão. A missão atual permanece visível no histórico.
                </div>
              )}
              <Field label="Título">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Objetivo">
                <Textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </Field>
              <Field label="Descrição">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <Field label="Contexto">
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </Field>
              {isNew && (
                <Field label="Fase de origem (opcional)">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={phaseId}
                    onChange={(e) => setPhaseId(e.target.value)}
                  >
                    <option value="">Sem fase (independente)</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        Fase {p.position} — {p.title}
                        {p.status !== "concluida"
                          ? " (bloqueada até concluir a fase)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {!isNew && (
                <Field label="Motivo da alteração (opcional)">
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex.: surgiu uma nova exigência"
                  />
                </Field>
              )}

              {mission && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
                      <GitBranch className="size-3.5" /> Dependências
                    </h4>
                    {myDeps.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma dependência. A missão pode ser executada.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-xs text-foreground">
                        {myDeps.map((d) => {
                          const dep = allMissions.find(
                            (m) => m.id === d.depends_on_mission_id,
                          );
                          return (
                            <li key={d.id} className="flex items-center gap-2">
                              <span
                                className={
                                  missionStatusBadge(dep?.status ?? "bloqueada")
                                    .className
                                }
                              >
                                {dep?.status ?? "?"}
                              </span>
                              {dep?.title ?? "missão removida"}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <div className="mt-2 flex gap-2">
                      <select
                        className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                        value={depId}
                        onChange={(e) => setDepId(e.target.value)}
                      >
                        <option value="">Depende de…</option>
                        {allMissions
                          .filter(
                            (m) =>
                              m.id !== mission.id && m.status !== "substituida",
                          )
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!depId}
                        onClick={doAddDependency}
                      >
                        Vincular
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
                      <History className="size-3.5" /> Versões (
                      {missionVersions.length})
                    </h4>
                    <ul className="space-y-1">
                      {missionVersions.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <button
                            type="button"
                            className={`text-left text-xs ${
                              latestVersion?.id === v.id
                                ? "font-semibold text-primary"
                                : "text-muted-foreground underline underline-offset-2"
                            }`}
                            onClick={() => setViewVersion(v.version_number)}
                          >
                            v{v.version_number}
                            {latestVersion?.id === v.id ? " (atual)" : ""}
                          </button>
                          <span className="text-[10px] text-faint">
                            {formatDateTime(v.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {viewedVersion && (
                      <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                        <SnapshotView
                          snapshot={viewedVersion.complete_snapshot}
                        />
                        {viewedVersion.change_reason && (
                          <p className="mt-2 text-xs text-faint">
                            Motivo: {viewedVersion.change_reason}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 px-0"
                          onClick={() => {
                            const c = versionContent(viewedVersion);
                            setTitle(c.title);
                            setDescription(c.description);
                            setContext(c.context);
                            setObjective(c.objective);
                            toast.info(
                              `Conteúdo da v${viewedVersion.version_number} carregado. Salvar criará uma nova versão.`,
                            );
                          }}
                        >
                          Retomar como nova versão
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mission && (
                <div>
                  <h4 className="mb-2 font-display text-sm font-semibold">
                    Documentos e referências
                  </h4>
                  <AttachmentList
                    attachments={missionAttachments}
                    frozen={false}
                    onDelete={(id) =>
                      void deleteAttachment
                        .mutateAsync(id)
                        .then(() => toast.success("Anexo removido."))
                        .catch((e) =>
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Falha ao remover.",
                          ),
                        )
                    }
                  />
                  <div className="mt-3">
                    <AttachmentUploader
                      projectId={projectId}
                      missionId={mission.id}
                      onUploaded={() => undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            {!isNew && !frozen && (
              <Button type="button" variant="ghost" onClick={doDelete}>
                <Trash2 className="size-3.5 text-destructive" /> Remover
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              {isNew ? (
                <Button type="button" onClick={save}>
                  Criar missão
                </Button>
              ) : frozen ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              ) : substituting ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSubstituting(false)}
                  >
                    Cancelar substituição
                  </Button>
                  <Button type="button" onClick={doSubstitute}>
                    <Repeat className="size-3.5" /> Confirmar substituição
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubstituting(true);
                      setTitle("");
                    }}
                  >
                    <Repeat className="size-3.5" /> Substituir missão
                  </Button>
                  {lifecycleAction}
                  <Button type="button" variant="outline" onClick={save}>
                    <Save className="size-3.5" /> Salvar nova versão
                  </Button>
                  <Button
                    type="button"
                    disabled={mission?.status === "bloqueada"}
                    onClick={() => setConfirming(true)}
                  >
                    Concluir missão
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mission && (
        <ConfirmMissionDialog
          open={confirming}
          mission={mission}
          onOpenChange={setConfirming}
          onConfirm={doConclude}
        >
          <AttachmentUploader
            projectId={projectId}
            missionId={mission.id}
            label="Anexar documento de conclusão"
            onUploaded={() => undefined}
          />
        </ConfirmMissionDialog>
      )}
    </>
  );
}

function ComplementSection({
  complements,
  content,
  reason,
  onContent,
  onReason,
  onAdd,
}: {
  complements: MissionComplement[];
  content: string;
  reason: string;
  onContent: (v: string) => void;
  onReason: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-display text-sm font-semibold">
        Registros complementares
      </h4>
      {complements.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum complemento. Se precisar corrigir ou acrescentar algo, crie um
          complemento — o registro original permanece intacto.
        </p>
      ) : (
        <ul className="space-y-2">
          {complements.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-border bg-background p-3"
            >
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {c.content}
              </p>
              <p className="mt-1 text-[11px] text-faint">
                {formatDateTime(c.created_at)}
                {c.reason ? ` · ${c.reason}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => onContent(e.target.value)}
          placeholder="O que precisa ser corrigido ou acrescentado?"
        />
        <Input
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="Motivo (opcional)"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={content.trim() === ""}
          onClick={onAdd}
        >
          Criar registro complementar
        </Button>
      </div>
    </div>
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
