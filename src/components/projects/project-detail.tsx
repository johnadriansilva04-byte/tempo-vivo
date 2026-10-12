import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  History,
  ListChecks,
  Lock,
  Plus,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/page-kit";
import { HistoryPanel } from "@/components/projects/history-panel";
import { MissionEditor } from "@/components/projects/mission-editor";
import { PhaseEditor } from "@/components/projects/phase-editor";
import { PhaseTimeline } from "@/components/projects/phase-timeline";
import {
  formatDateTime,
  missionStatusBadge,
} from "@/components/projects/status";
import {
  useCreatePhase,
  useProject,
  useUpdateProjectContext,
} from "@/hooks/use-projects";
import type { Mission } from "@/types/projects";

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { bundle, isLoading, error } = useProject(projectId);

  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [missionEditor, setMissionEditor] = useState<{
    open: boolean;
    mission: Mission | null;
    defaultPhaseId: string | null;
  }>({ open: false, mission: null, defaultPhaseId: null });
  const [historyOpen, setHistoryOpen] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-faint">Carregando projeto…</p>;
  }
  if (error || !bundle) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Projeto não encontrado."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/projetos">
            <ArrowLeft className="size-3.5" /> Voltar aos projetos
          </Link>
        </Button>
      </div>
    );
  }

  const {
    project,
    phases,
    missions,
    phaseRecords,
    missionRecords,
    dependencies,
    versions,
    complements,
    attachments,
    events,
  } = bundle;
  const recordsByPhase = new Map(phaseRecords.map((r) => [r.phase_id, r]));
  const recordsByMission = new Map(
    missionRecords.map((r) => [r.mission_id, r]),
  );
  const completed = phases.filter((p) => p.status === "concluida").length;
  const progress =
    phases.length === 0 ? 0 : Math.round((completed / phases.length) * 100);
  const currentPhase =
    phases.find((p) => p.status === "em_andamento") ??
    phases.find((p) => p.status === "disponivel") ??
    null;

  const openPhase = phases.find((p) => p.id === openPhaseId) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="px-0">
          <Link to="/projetos">
            <ArrowLeft className="size-3.5" /> Projetos
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <History className="size-3.5" /> Histórico do projeto
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setMissionEditor({
                open: true,
                mission: null,
                defaultPhaseId: null,
              })
            }
          >
            <Plus className="size-3.5" /> Adicionar missão
          </Button>
        </div>
      </div>

      <header className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
          Projeto
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {project.name}
        </h1>
        {project.objective && (
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <Target className="mt-0.5 size-4 shrink-0 text-primary" />
            {project.objective}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" /> Criado em{" "}
            {formatDateTime(project.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> {completed} de {phases.length}{" "}
            fases concluídas
          </span>
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar value={progress} />
        </div>
        {currentPhase && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Fase atual:</span>{" "}
            {currentPhase.position} — {currentPhase.title}
          </p>
        )}
      </header>

      {/* RESUMO / HISTÓRICO ANTERIOR */}
      <section className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-faint">
            <Lock className="size-3.5" /> Resumo — histórico anterior
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {project.initial_summary || "Nenhum resumo inicial registrado."}
          </p>
          <p className="mt-2 text-[11px] text-faint">
            Registro histórico: preservado como estava no momento do registro.
          </p>
        </div>
        <ContextEditor
          projectId={project.id}
          context={project.current_context}
        />
      </section>

      {/* FASES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <ListChecks className="size-4 text-primary" /> Fases do projeto
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddPhaseOpen(true)}
          >
            <Plus className="size-3.5" /> Adicionar fase
          </Button>
        </div>

        {phases.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma fase ainda. Adicione a primeira para começar a trajetória.
          </p>
        ) : (
          <PhaseTimeline
            phases={phases}
            recordsByPhase={recordsByPhase}
            onOpen={setOpenPhaseId}
          />
        )}
      </section>

      {/* MISSÕES */}
      <MissionsSection
        missions={missions}
        onOpen={(mission) =>
          setMissionEditor({
            open: true,
            mission,
            defaultPhaseId: mission.phase_id,
          })
        }
      />

      {historyOpen && (
        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <History className="size-4 text-primary" /> Histórico do projeto
          </h2>
          <HistoryPanel events={events} />
        </section>
      )}

      {openPhase && (
        <PhaseEditor
          projectId={projectId}
          phase={openPhase}
          record={recordsByPhase.get(openPhase.id) ?? null}
          attachments={attachments}
          open={openPhaseId !== null}
          onOpenChange={(o) => !o && setOpenPhaseId(null)}
        />
      )}

      {missionEditor.open && (
        <MissionEditor
          projectId={projectId}
          // Deriva a missão do bundle atual: o objeto guardado no estado é um
          // snapshot do clique e ficaria desatualizado após iniciar/pausar.
          mission={
            missionEditor.mission
              ? (missions.find((m) => m.id === missionEditor.mission!.id) ??
                missionEditor.mission)
              : null
          }
          phases={phases}
          allMissions={missions}
          dependencies={dependencies}
          versions={versions}
          complements={complements}
          attachments={attachments}
          record={
            missionEditor.mission
              ? (recordsByMission.get(missionEditor.mission.id) ?? null)
              : null
          }
          defaultPhaseId={missionEditor.defaultPhaseId}
          open={missionEditor.open}
          onOpenChange={(o) =>
            setMissionEditor((s) => ({
              ...s,
              open: o,
              ...(o ? {} : { mission: null }),
            }))
          }
        />
      )}

      <AddPhaseDialog
        open={addPhaseOpen}
        projectId={projectId}
        onOpenChange={setAddPhaseOpen}
      />
    </div>
  );
}

function MissionsSection({
  missions,
  onOpen,
}: {
  missions: Mission[];
  onOpen: (mission: Mission) => void;
}) {
  const active = missions.filter((m) =>
    ["bloqueada", "disponivel", "em_andamento", "pausada"].includes(m.status),
  );
  const concluded = missions.filter((m) => m.status === "concluida");
  const replaced = missions.filter((m) => m.status === "substituida");
  const cancelled = missions.filter((m) => m.status === "cancelada");

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <ListChecks className="size-4 text-primary" /> Missões adicionais
        </h2>
        <p className="text-xs text-faint">
          Tarefas extras, investigações, correções e mudanças de estratégia —
          fora do cronograma de fases.
        </p>
      </div>

      {missions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma missão adicional. Use “Adicionar missão” para tarefas extras,
          investigações, correções ou mudanças de estratégia.
        </p>
      )}

      <MissionGroup
        title="Ativas"
        missions={active}
        allMissions={missions}
        onOpen={onOpen}
        emptyLabel="Nenhuma missão ativa."
      />
      {concluded.length > 0 && (
        <MissionGroup title="Concluídas" missions={concluded} onOpen={onOpen} />
      )}
      {replaced.length > 0 && (
        <MissionGroup
          title="Substituídas (preservadas no histórico)"
          missions={replaced}
          allMissions={missions}
          onOpen={onOpen}
        />
      )}
      {cancelled.length > 0 && (
        <MissionGroup
          title="Canceladas (preservadas no histórico)"
          missions={cancelled}
          onOpen={onOpen}
        />
      )}
    </section>
  );
}

function MissionGroup({
  title,
  missions,
  allMissions,
  onOpen,
  emptyLabel,
}: {
  title: string;
  missions: Mission[];
  allMissions?: Mission[];
  onOpen: (mission: Mission) => void;
  emptyLabel?: string;
}) {
  if (missions.length === 0) {
    return emptyLabel ? (
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    ) : null;
  }
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
        {title}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {missions.map((m) => {
          const badge = missionStatusBadge(m.status);
          const substitute =
            allMissions?.find((x) => x.replaces_mission_id === m.id) ?? null;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onOpen(m)}
                className="expand-card w-full text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {m.title}
                    </span>
                    <span className={badge.className}>{badge.label}</span>
                  </span>
                  {substitute && (
                    <span className="mt-1 block text-xs text-primary">
                      Substituída pela missão “{substitute.title}”
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContextEditor({
  projectId,
  context,
}: {
  projectId: string;
  context: string;
}) {
  const [value, setValue] = useState(context);
  const [reason, setReason] = useState("");
  const update = useUpdateProjectContext(projectId);

  const save = async () => {
    try {
      await update.mutateAsync({ context: value, reason });
      toast.success(
        "Contexto atualizado — o resumo inicial permanece intacto.",
      );
      setReason("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Falha ao atualizar contexto.",
      );
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">
        Contexto atual
      </h3>
      <Textarea
        className="mt-3"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Situação atual do projeto…"
      />
      <Input
        className="mt-2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo da atualização (opcional)"
      />
      <Button size="sm" variant="outline" className="mt-3" onClick={save}>
        Atualizar contexto
      </Button>
    </div>
  );
}

function AddPhaseDialog({
  open,
  projectId,
  onOpenChange,
}: {
  open: boolean;
  projectId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const createPhase = useCreatePhase(projectId);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [criteria, setCriteria] = useState("");

  const reset = () => {
    setTitle("");
    setObjective("");
    setDescription("");
    setInstructions("");
    setCriteria("");
  };

  const submit = async () => {
    if (title.trim() === "") {
      toast.error("A fase precisa de um título.");
      return;
    }
    try {
      await createPhase.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        objective,
        description,
        instructions,
        criteria,
      });
      toast.success("Fase adicionada.");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao adicionar fase.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar fase</DialogTitle>
          <DialogDescription>
            A nova fase é acrescentada ao fim do cronograma. Se houver fases
            concluídas antes dela, o histórico é preservado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Objetivo</Label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição da tarefa</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Instruções</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Critérios de conclusão</Label>
            <Textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Adicionar fase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
