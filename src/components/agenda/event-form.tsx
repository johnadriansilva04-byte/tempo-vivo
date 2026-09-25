import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  REPEAT_PRESETS,
  WEEKDAY_OPTIONS,
  sameDays,
  type EventDraft,
} from "@/components/agenda/draft";
import { cn } from "@/lib/utils";

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

  const toggleDay = (day: number) => {
    const has = draft.repeatDays.includes(day);
    set("repeatDays", has ? draft.repeatDays.filter((d) => d !== day) : [...draft.repeatDays, day]);
  };

  const repeating = draft.repeatDays.length > 0;

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

      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Repetir</Label>
          <span className="text-xs text-muted-foreground">
            {repeating ? "Compromisso repetido" : "Uma vez"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_OPTIONS.map(([day, label]) => {
            const active = draft.repeatDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                aria-label={label}
                onClick={() => toggleDay(day)}
                className={cn(
                  "min-w-9 rounded-md border border-border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:border-primary/40",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REPEAT_PRESETS.map(([label, days]) => {
            const active = sameDays(draft.repeatDays, days);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => set("repeatDays", active ? [] : days)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground underline-offset-2 hover:underline",
                )}
              >
                {label}
              </button>
            );
          })}
          {repeating && (
            <button
              type="button"
              onClick={() => set("repeatDays", [])}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpar
            </button>
          )}
        </div>

        {repeating && (
          <div className="space-y-1.5">
            <Label htmlFor="ev-until" className="text-xs text-muted-foreground">
              Repetir até (opcional)
            </Label>
            <Input
              id="ev-until"
              type="date"
              min={draft.event_date}
              value={draft.repeatUntil}
              onChange={(e) => set("repeatUntil", e.target.value)}
            />
          </div>
        )}
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
