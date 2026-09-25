import { useState } from "react";
import { FolderKanban, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageSkeleton, ProgressBar } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useProjects, useUpsertProject } from "@/hooks/use-projects";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import type { Project } from "@/types/profile";

const STATUS_TONE: Record<string, string> = {
  Concluído: "status-open",
  "Em andamento": "status-review",
  Pesquisa: "status-review",
  Planejado: "status-neutral",
};

/** Projetos: um cartão por iniciativa, com status, progresso e link. */
export function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const upsert = useUpsertProject();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    status: "Planejado" as Project["status"],
    progress: 0,
    objective: "",
    link: "",
  });

  const submit = () => {
    if (!draft.name.trim()) return;
    upsert.mutate(
      { ...draft, name: draft.name.trim() },
      {
        onSuccess: () => {
          setDraft({
            name: "",
            description: "",
            status: "Planejado",
            progress: 0,
            objective: "",
            link: "",
          });
          setOpen(false);
        },
      },
    );
  };

  if (isLoading) return <PageSkeleton lines={1} rows={2} />;

  return (
    <>
      <PageHeader
        title="Projetos"
        detail={projects.length > 0 ? `${projects.length} em curso` : undefined}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
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
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              <option value="Planejado">Planejado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pesquisa">Pesquisa</option>
              <option value="Concluído">Concluído</option>
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
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={submit} disabled={!draft.name.trim() || upsert.isPending}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
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
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article className="project-card flex flex-col" key={project.name}>
              <div className="flex items-center justify-between gap-3">
                <span className={`status ${STATUS_TONE[project.status] ?? "status-neutral"}`}>
                  {project.status}
                </span>
                <span className="text-xs font-medium">{project.progress}%</span>
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
    </>
  );
}
