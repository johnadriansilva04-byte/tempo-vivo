import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageSkeleton, ProgressBar } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { StoryText } from "@/components/story-text";
import { Disclosure } from "@/components/ui/disclosure";
import { useProjects, useUpsertProject } from "@/hooks/use-projects";
import type { Project } from "@/types/profile";
import { Field } from "@/components/pages/shared";

// --------------------------------------------------------------- ProjectsPage

export function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const upsert = useUpsertProject();
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    objective: "",
    status: "Planejado" as Project["status"],
  });
  const [open, setOpen] = useState(false);

  const startNew = () => {
    setDraft({ name: "", description: "", objective: "", status: "Planejado" });
    setOpen(true);
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    upsert.mutate(
      { ...draft, name: draft.name.trim(), progress: 0 },
      {
        onSuccess: () => {
          setDraft({ name: "", description: "", objective: "", status: "Planejado" });
          setOpen(false);
        },
      },
    );
  };

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Trabalho em movimento"
        title="Projetos"
        mark="V"
        description="Iniciativas que conectam curiosidade, propósito e impacto ao longo do tempo."
        lede="Projeto é intenção com prazo. Aqui ela sai do papel e ganha dono, objetivo e avanço."
        action={
          <Button size="sm" onClick={startNew}>
            <Plus className="size-3.5" /> Novo projeto
          </Button>
        }
      />

      {/* O formulário nasce fechado: só ocupa a tela quando você decide criar. */}
      <Disclosure
        icon={Plus}
        title="Novo projeto"
        description="Nome, status, descrição e objetivo — nada além do que move o trabalho."
        summary={draft.name.trim() ? draft.name : "Abra para descrever o próximo projeto."}
        open={open}
        onOpenChange={setOpen}
        className="mb-6"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nome do projeto"
            />
          </Field>
          <Field label="Status">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Project["status"] })}
            >
              <option value="Planejado">Planejado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pesquisa">Pesquisa</option>
              <option value="Concluído">Concluído</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição">
              <Input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Em poucas palavras"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Objetivo">
              <Input
                value={draft.objective}
                onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
                placeholder="O que você quer alcançar"
              />
            </Field>
          </div>
        </div>
        <Button
          size="sm"
          className="mt-4"
          onClick={submit}
          disabled={!draft.name.trim() || upsert.isPending}
        >
          Salvar projeto
        </Button>
      </Disclosure>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-5" />}
          title="Nada aqui ainda"
          description="Seus projetos aparecerão aqui. Crie um acima para começar — tudo fica salvo."
          actionLabel="Criar o primeiro projeto"
          onAction={startNew}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <article className="project-card" key={p.name}>
              <div className="flex justify-between">
                <span className="status status-neutral">{p.status}</span>
                <span className="text-xs font-medium">{p.progress}%</span>
              </div>
              <h2 className="mt-6 font-display text-xl font-semibold">
                <StoryText text={p.name} />
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                <StoryText text={p.description} />
              </p>
              {p.objective.trim() !== "" && (
                <>
                  <p className="mt-5 text-xs text-faint">Objetivo</p>
                  <p className="mt-1 text-sm">
                    <StoryText text={p.objective} />
                  </p>
                </>
              )}
              <div className="mt-6">
                <ProgressBar value={p.progress} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
