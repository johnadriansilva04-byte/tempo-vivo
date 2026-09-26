import { useState } from "react";
import { Check, Plus, Trophy, X } from "lucide-react";
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
import { PageHeader, PageSkeleton } from "@/components/page-kit";
import { EmptyState } from "@/components/empty-state";
import { useCreateMilestone, useDeleteMilestone, useMilestones } from "@/hooks/use-milestones";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import type { Milestone } from "@/types/profile";

/** Vitrine de conquistas: cartão, ano, título e categoria. */
export function AchievementsPage() {
  const { milestones, isLoading } = useMilestones();
  const create = useCreateMilestone();
  const remove = useDeleteMilestone();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Milestone | null>(null);
  const [draft, setDraft] = useState({
    year: String(new Date().getFullYear()),
    title: "",
    category: "Vida",
  });

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate(
      { ...draft, description: "" },
      {
        onSuccess: () => {
          setDraft({ ...draft, title: "" });
          setOpen(false);
          toast.success("Conquista registrada.");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete?.id) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success("Conquista removida.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível remover."),
    });
  };

  if (isLoading) return <PageSkeleton lines={1} rows={2} />;

  const visible = milestones.filter((m) => !isPlaceholderText(m.title));
  const ordered = [...visible].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));

  return (
    <>
      <PageHeader
        title="Realizações"
        detail={
          ordered.length > 0
            ? `${ordered.length} ${ordered.length === 1 ? "conquista" : "conquistas"}`
            : undefined
        }
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Conquista
          </Button>
        }
      />

      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[6rem_1fr_10rem]">
            <Input
              autoFocus
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              placeholder="Ano"
              inputMode="numeric"
            />
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ex.: Primeiro artigo científico"
            />
            <Input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Categoria"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={submit} disabled={!draft.title.trim() || create.isPending}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {ordered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Nenhuma conquista ainda"
          description="Registre a primeira para vê-la aqui."
          actionLabel="Registrar conquista"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="achievement-grid">
          {ordered.map((milestone) => (
            <article className="achievement-card group" key={milestone.id ?? milestone.title}>
              <span className="achievement-check">
                <Check className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-faint">{milestone.year}</p>
                <p className="tile-clamp mt-0.5 text-sm font-semibold text-foreground">
                  {readableText(milestone.title)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{milestone.category}</p>
              </div>
              {milestone.id && (
                <button
                  type="button"
                  aria-label={`Remover ${milestone.title}`}
                  className="opacity-60 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  onClick={() => setPendingDelete(milestone)}
                >
                  <X className="size-3.5 text-faint" />
                </button>
              )}
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
            <AlertDialogTitle>Remover “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
