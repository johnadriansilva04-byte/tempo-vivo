import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-kit";
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
import { formatDateTime, phaseStatusBadge } from "@/components/projects/status";
import { useCreateProject, useProjects } from "@/hooks/use-projects";

/**
 * Tela inicial de projetos: a trajetória de cada um (resumo, fases concluídas,
 * fase atual e próximo passo) e a opção “+ Novo projeto”.
 */
export function ProjectsPage() {
  const { summaries, isLoading, error } = useProjects();
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Projetos"
        title="Execução por fases"
        description="Cada projeto tem uma trajetória: resumo do que já aconteceu, fases sequenciais, bloqueios e registros que não podem ser reescritos."
        action={
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5" /> Novo projeto
          </Button>
        }
      />

      {isLoading && <p className="text-sm text-faint">Carregando projetos…</p>}
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Falha ao carregar projetos."}
        </p>
      )}

      {!isLoading && summaries.length === 0 && (
        <div className="quiet-panel">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem projetos. Crie o primeiro para começar a
            registrar a trajetória, as fases e o histórico.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setNewOpen(true)}>
            <Plus className="size-3.5" /> Novo projeto
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {summaries.map((s) => {
          const progress =
            s.totalPhases === 0
              ? 0
              : Math.round((s.completedPhases / s.totalPhases) * 100);
          const currentBadge = s.currentPhase
            ? phaseStatusBadge(s.currentPhase.status)
            : null;
          return (
            <Link
              key={s.project.id}
              to="/projetos/$projectId"
              params={{ projectId: s.project.id }}
              className="project-card block"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {s.project.name}
                </h2>
                <ArrowRight className="size-4 shrink-0 text-faint" />
              </div>
              {s.project.objective && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {s.project.objective}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-faint">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="size-3.5" /> {s.completedPhases}/
                  {s.totalPhases} fases
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" />{" "}
                  {formatDateTime(s.project.created_at)}
                </span>
                {s.activeMissionCount > 0 && (
                  <span>{s.activeMissionCount} missão(ões) ativa(s)</span>
                )}
              </div>

              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>

              {s.currentPhase && currentBadge && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={currentBadge.className}>
                    {currentBadge.label}
                  </span>
                  <span className="text-muted-foreground">
                    Fase {s.currentPhase.position} — {s.currentPhase.title}
                  </span>
                </div>
              )}
              {s.nextStep && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Próximo passo:
                  </span>{" "}
                  {s.nextStep}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [summary, setSummary] = useState("");
  const [context, setContext] = useState("");

  const submit = async () => {
    if (name.trim() === "") {
      toast.error("O projeto precisa de um nome.");
      return;
    }
    try {
      const id = await createProject.mutateAsync({
        name: name.trim(),
        objective,
        initial_summary: summary,
        context,
      });
      toast.success("Projeto criado.");
      onOpenChange(false);
      setName("");
      setObjective("");
      setSummary("");
      setContext("");
      void navigate({ to: "/projetos/$projectId", params: { projectId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar projeto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Comece pela trajetória: o resumo registra tudo o que aconteceu antes
            de usar a aplicação. Depois você adiciona as fases.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: ANPP"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Objetivo principal</Label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Resumo de tudo o que aconteceu até agora</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="O que aconteceu, o que já foi feito, quais documentos existem, que decisões foram tomadas…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contexto geral / situação atual</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar projeto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
