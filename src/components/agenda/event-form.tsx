import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EventDraft } from "@/components/agenda/draft";

/** Formulário de compromisso. Sem lógica de dados: recebe, devolve e salva. */
export function EventForm({
  draft,
  onChange,
  onSave,
  onDelete,
  onCancel,
  pending,
}: {
  draft: EventDraft;
  onChange: (draft: EventDraft) => void;
  onSave: () => void;
  onDelete?: (() => void) | undefined;
  onCancel: () => void;
  pending: boolean;
}) {
  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const canSave = draft.title.trim() !== "" && draft.event_date !== "";

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ev-title" className="text-xs text-muted-foreground">
          Título
        </Label>
        <Input
          id="ev-title"
          autoFocus
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ex.: Dentista"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ev-date" className="text-xs text-muted-foreground">
            Data
          </Label>
          <Input
            id="ev-date"
            type="date"
            required
            value={draft.event_date}
            onChange={(e) => set("event_date", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-start" className="text-xs text-muted-foreground">
            Início
          </Label>
          <Input
            id="ev-start"
            type="time"
            value={draft.start_time}
            onChange={(e) => set("start_time", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-end" className="text-xs text-muted-foreground">
            Fim
          </Label>
          <Input
            id="ev-end"
            type="time"
            value={draft.end_time}
            onChange={(e) => set("end_time", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ev-place" className="text-xs text-muted-foreground">
          Local
        </Label>
        <Input
          id="ev-place"
          value={draft.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Opcional"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ev-notes" className="text-xs text-muted-foreground">
          Notas
        </Label>
        <Textarea
          id="ev-notes"
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Opcional"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" disabled={!canSave || pending}>
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {onDelete && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={pending}
          >
            Excluir
          </Button>
        )}
      </div>
    </form>
  );
}
