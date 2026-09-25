import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DayPanel } from "@/components/agenda/day-panel";
import type { EventDraft } from "@/components/agenda/draft";
import { dayLabel } from "@/lib/calendar";
import type { AgendaEvent } from "@/types/profile";

/**
 * Painel do dia: abre pela direita quando um dia é clicado no calendário.
 * É a "aba" das atividades — o calendário fica limpo e o detalhe vive aqui.
 */
export function DaySheet({
  open,
  iso,
  events,
  conflicts,
  editing,
  draft,
  pending,
  onOpenChange,
  onDraftChange,
  onStartEdit,
  onStartCreate,
  onDuplicate,
  onSave,
  onDelete,
  onRemoveOccurrence,
  onCancel,
}: {
  open: boolean;
  iso: string;
  events: AgendaEvent[];
  conflicts: Set<string>;
  editing: boolean;
  draft: EventDraft | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: EventDraft) => void;
  onStartEdit: (event: AgendaEvent) => void;
  onStartCreate: () => void;
  onDuplicate: (event: AgendaEvent) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onRemoveOccurrence: (event: AgendaEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="font-display text-base font-semibold capitalize">
            {dayLabel(iso)}
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <DayPanel
            iso={iso}
            events={events}
            conflicts={conflicts}
            editing={editing}
            draft={draft}
            pending={pending}
            showHeader={false}
            onDraftChange={onDraftChange}
            onStartEdit={onStartEdit}
            onStartCreate={onStartCreate}
            onDuplicate={onDuplicate}
            onSave={onSave}
            onDelete={onDelete}
            onRemoveOccurrence={onRemoveOccurrence}
            onCancel={onCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
