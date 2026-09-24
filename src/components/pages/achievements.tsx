import { useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageSkeleton } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { StoryText } from "@/components/story-text";
import { useCreateMilestone, useMilestones } from "@/hooks/use-milestones";
import { isPlaceholderText } from "@/lib/placeholder";
import { Field } from "@/components/pages/shared";

// ------------------------------------------------------------ AchievementsPage

export function AchievementsPage() {
  const { milestones, isLoading } = useMilestones();
  const create = useCreateMilestone();
  const [draft, setDraft] = useState({
    year: String(new Date().getFullYear()),
    title: "",
    description: "",
    category: "Vida",
  });
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(draft, { onSuccess: () => setDraft({ ...draft, title: "", description: "" }) });
  };

  if (isLoading) return <PageSkeleton lines={2} rows={2} />;

  return (
    <>
      <PageHeader
        eyebrow="Marcos preservados"
        title="Realizações"
        mark="IV"
        description="Uma linha do tempo do que mudou sua história — grandes conquistas e viradas silenciosas."
        lede="O que você já atravessou é argumento: prova concreta de que consegue de novo."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Fechar" : "Registrar marco"}
          </Button>
        }
      />
      {open && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <Field label="Ano">
            <Input
              className="w-24"
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </Field>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Título
            </Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="O que aconteceu"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Categoria
            </Label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Vida, Pesquisa…"
            />
          </div>
          <div className="flex-[2] space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-faint">
              Descrição
            </Label>
            <Input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Como isso mudou sua história"
            />
          </div>
          <Button size="sm" onClick={submit} disabled={!draft.title.trim() || create.isPending}>
            Salvar
          </Button>
        </div>
      )}
      {milestones.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Nenhum marco preservado"
          description="Registre o primeiro: uma conquista, virada ou aprendizado do seu percurso."
        />
      ) : (
        <div className="achievement-list">
          {milestones.map((m) => (
            <article key={`${m.year}-${m.title}`}>
              <div className="achievement-year">{isPlaceholderText(m.year) ? "" : m.year}</div>
              <div className="achievement-dot" />
              <div className="pb-10">
                <span className="status status-neutral">{m.category}</span>
                <h2 className="mt-3 font-display text-xl font-semibold">
                  <StoryText text={m.title} />
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  <StoryText text={m.description} />
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
