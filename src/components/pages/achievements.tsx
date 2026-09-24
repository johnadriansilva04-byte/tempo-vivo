import { useState } from "react";
import { Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageSkeleton } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { StoryText } from "@/components/story-text";
import { Disclosure } from "@/components/ui/disclosure";
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
    create.mutate(draft, {
      onSuccess: () => {
        setDraft({ ...draft, title: "", description: "" });
        setOpen(false);
      },
    });
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
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Registrar marco
          </Button>
        }
      />

      <Disclosure
        icon={Plus}
        title="Registrar marco"
        description="O que aconteceu, quando e em que área da vida."
        summary={
          draft.title.trim() ? `${draft.year} · ${draft.title}` : "Abra para preservar um marco."
        }
        open={open}
        onOpenChange={setOpen}
        className="mb-6"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ano">
            <Input
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </Field>
          <Field label="Categoria">
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Vida, Pesquisa…"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Título">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="O que aconteceu"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descrição">
              <Input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Como isso mudou sua história"
              />
            </Field>
          </div>
        </div>
        <Button
          size="sm"
          className="mt-4"
          onClick={submit}
          disabled={!draft.title.trim() || create.isPending}
        >
          Salvar marco
        </Button>
      </Disclosure>
      {milestones.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Nenhum marco preservado"
          description="Registre o primeiro: uma conquista, virada ou aprendizado do seu percurso."
          actionLabel="Registrar marco"
          onAction={() => setOpen(true)}
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
