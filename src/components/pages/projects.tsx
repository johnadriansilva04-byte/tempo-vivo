import { useState } from "react";
import { FolderKanban, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, PageSkeleton, ProgressBar } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useDeleteProject, useProjects, useUpsertProject } from "@/hooks/use-projects";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import type { Project } from "@/types/profile";

const STATUS_TONE: Record<string, string> = {
  Concluído: "status-open",
  "Em andamento": "status-review",
  Pesquisa: "status-review",
  Planejado: "status-neutral",
};

const STATUSES: Project["status"][] = ["Planejado", "Em andamento", "Pesquisa", "Concluído"];

const EMPTY_DRAFT = {
  name: "",
  description: "",
  status: "Planejado" as Project["status"],
  progress: 0,
  objective: "",
  link: "",
};

/** Projetos: um cartão por iniciativa, com status, progresso e link. */
export function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const upsert = useUpsertProject();
  const remove = useDeleteProject();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  /** Nome original quando se edita um projeto — vazio ao criar. */
  const [editingName, setEditingName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const startCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditingName("");
    setOpen(true);
  };

  const startEdit = (project: Project) => {
    setDraft({ ...project });
    setEditingName(project.name);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setDraft(EMPTY_DRAFT);
    setEditingName("");
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    const next = { ...draft, name: draft.name.trim() };
    // Renomear é trocar a identidade lógica: remove o registro antigo antes.
    const renamed = editingName !== "" && editingName !== next.name;
    upsert.mutate(next, {
      onSuccess: async () => {
        if (renamed) await remove.mutateAsync(editingName);
        close();
        toast.success(editingName ? "Projeto atualizado." : "Projeto criado.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.name, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success("Projeto excluído.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível excluir."),
    });
  };

  if (isLoading) return <PageSkeleton lines={1} rows={2} />;

  return (
    <>
      <PageHeader
        title="Projetos"
        detail={projects.length > 0 ? `${projects.length} em curso` : undefined}
        action={
          <Button size="sm" onClick={startCreate}>
            <Plus className="size-3.5" /> Projeto
          </Button>
        }
      />

      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nome do projeto"
            />
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Project["status"] })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Input
              value={draft.link}
              onChange={(e) => setDraft({ ...draft, link: e.target.value })}
              placeholder="Link (https://…)"
            />
          </div>
          <Input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Descrição curta"
            className="mt-3"
          />
          <div className="mt-3 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-3 text-xs text-muted-foreground">
              Progresso
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.progress}
                onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
                className="flex-1 accent-primary"
                aria-label="Progresso do projeto"
              />
              <span className="w-9 text-right font-semibold text-foreground">
                {draft.progress}%
              </span>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={submit}
              disabled={!draft.name.trim() || upsert.isPending || remove.isPending}
            >
              {editingName ? "Salvar alterações" : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-5" />}
          title="Nenhum projeto ainda"
          description="Crie o primeiro para acompanhar o avanço aqui."
          actionLabel="Criar projeto"
          onAction={startCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article className="project-card group flex flex-col" key={project.name}>
              <div className="flex items-center justify-between gap-3">
                <span className={`status ${STATUS_TONE[project.status] ?? "status-neutral"}`}>
                  {project.status}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">{project.progress}%</span>
                  <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Editar ${project.name}`}
                      onClick={() => startEdit(project)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Excluir ${project.name}`}
                      onClick={() => setPendingDelete(project)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">
                {isPlaceholderText(project.name) ? "" : project.name}
              </h2>
              {project.description.trim() !== "" && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {readableText(project.description)}
                </p>
              )}
              <div className="mt-4">
                <ProgressBar value={project.progress} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                {project.link.trim() !== "" ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-foreground"
                  >
                    <Link2 className="size-3.5" />
                    Abrir projeto
                  </a>
                ) : (
                  <span className="text-xs text-faint">Sem link</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
