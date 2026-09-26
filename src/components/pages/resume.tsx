import { useState } from "react";
import { Plus, X } from "lucide-react";
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
import {
  useCareerChapters,
  useCreateCareerChapter,
  useDeleteCareerChapter,
} from "@/hooks/use-career-chapters";
import { isPlaceholderText, readableText } from "@/lib/placeholder";
import type { CareerChapter } from "@/types/profile";

/** Linha do tempo da vida: ano, acontecimento e, se houver, uma linha de contexto. */
export function ResumePage() {
  const { chapters, isLoading } = useCareerChapters();
  const create = useCreateCareerChapter();
  const remove = useDeleteCareerChapter();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CareerChapter | null>(null);
  const [draft, setDraft] = useState({ period: "", title: "", content: "" });

  const submit = () => {
    if (!draft.title.trim()) return;
    create.mutate({ ...draft, document_type: "LIFE" } as Omit<CareerChapter, "id">, {
      onSuccess: () => {
        setDraft({ period: "", title: "", content: "" });
        setOpen(false);
        toast.success("Marco adicionado.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success("Marco removido.");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível remover."),
    });
  };

  if (isLoading) return <PageSkeleton lines={1} rows={2} />;

  const ordered = [...chapters].sort((a, b) => yearOf(a.period) - yearOf(b.period));

  return (
    <>
      <PageHeader
        title="Currículo"
        detail={
          ordered.length > 0 ? `${ordered.length} marcos de vida` : "Linha do tempo da sua vida"
        }
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Marco
          </Button>
        }
      />

      {open && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
            <Input
              autoFocus
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value })}
              placeholder="Ano"
              inputMode="numeric"
            />
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="O que aconteceu (ex.: Início da pesquisa científica)"
            />
          </div>
          <Input
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Uma linha de contexto (opcional)"
            className="mt-3"
          />
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
          icon={<Plus className="size-5" />}
          title="Sua linha do tempo está vazia"
          description="Comece pelo começo: o ano em que você nasceu."
          actionLabel="Adicionar o primeiro marco"
          onAction={() => setOpen(true)}
        />
      ) : (
        <ol className="timeline max-w-2xl">
          {ordered.map((chapter) => (
            <li className="timeline-entry group" key={chapter.id}>
              <span className="timeline-dot" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="timeline-year">
                    {isPlaceholderText(chapter.period) ? "" : chapter.period}
                  </p>
                  <p className="tile-clamp mt-0.5 text-sm font-medium text-foreground">
                    {readableText(chapter.title)}
                  </p>
                  {chapter.content.trim() !== "" && !isPlaceholderText(chapter.content) && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {readableText(chapter.content)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${chapter.title}`}
                  className="mt-1 shrink-0 opacity-60 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  onClick={() => setPendingDelete(chapter)}
                >
                  <X className="size-3.5 text-faint" />
                </button>
              </div>
            </li>
          ))}
        </ol>
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

/** Ano numérico para ordenar; sem número vai para o fim. */
function yearOf(period: string): number {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}
