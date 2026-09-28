import { Check, LockKeyhole, Pencil, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SmartTextarea } from "@/components/smart-textarea";
import { useUpsertDailyLog } from "@/hooks/use-daily-logs";
import type { DailyLog } from "@/types/profile";

const statusMeta: Record<
  DailyLog["status"],
  { label: string; className: string; editable: boolean }
> = {
  // Dentro das 24h (OPEN ou VALIDATING) o dia pode ser corrigido — a trigger do SQL
  // trava só após 24h. LOCKED é permanente (somente leitura).
  OPEN: { label: "Aberto", className: "status-open", editable: true },
  VALIDATING: {
    label: "Em validação",
    className: "status-review",
    editable: true,
  },
  LOCKED: { label: "Travado", className: "status-archive", editable: false },
};

function formatDay(isoDate: string): { day: string; weekday: string } {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .toUpperCase();
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const today = new Date().toISOString().slice(0, 10) === isoDate;
  return {
    day,
    weekday: today
      ? "Hoje"
      : weekday.charAt(0).toUpperCase() + weekday.slice(1),
  };
}

/** Um dia do livro de bordo: Planejado, Executado e Resumo — com trava de 24h. */
export function DailyLogCard({ log }: { log: DailyLog }) {
  const upsert = useUpsertDailyLog();
  const meta = statusMeta[log.status];
  const { day, weekday } = formatDay(log.log_date);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    planned_text: log.planned_text,
    executed_text: log.executed_text,
    summary_text: log.summary_text,
  });
  // Detecta se o resumo foi preenchido agora (ganho de XP — gamificação real).
  const summaryWasEmpty = useRef(log.summary_text.trim() === "");

  const save = async () => {
    await upsert.mutateAsync({ ...log, ...draft });
    setEditing(false);
    if (summaryWasEmpty.current && draft.summary_text.trim() !== "") {
      toast.success("+25 XP — a história de hoje foi registrada ✨", {
        icon: <Sparkles className="size-4 text-primary" />,
      });
      summaryWasEmpty.current = false;
    }
  };

  const lines = (text: string) => text.split("\n").filter(Boolean);

  return (
    <article
      className={`day-record ${log.status === "LOCKED" ? "day-locked" : ""}`}
    >
      <div className="day-heading">
        <div>
          <p className="font-display text-xl font-semibold">{day}</p>
          <p className="text-xs text-muted-foreground">{weekday}</p>
        </div>
        <div className="flex items-center gap-2">
          {meta.editable && !editing && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3" /> Registrar
            </Button>
          )}
          <span className={`status ${meta.className}`}>
            {log.status === "LOCKED" && <LockKeyhole className="size-3" />}
            {meta.label}
          </span>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3 p-4">
          <SmartTextarea
            label="Planejado"
            value={draft.planned_text}
            onChange={(v) => setDraft({ ...draft, planned_text: v })}
            onCommit={save}
            placeholder="Intenção do dia…"
          />
          <SmartTextarea
            label="Executado"
            value={draft.executed_text}
            onChange={(v) => setDraft({ ...draft, executed_text: v })}
            onCommit={save}
            placeholder="O que de fato aconteceu…"
          />
          <SmartTextarea
            label="Resumo"
            value={draft.summary_text}
            onChange={(v) => setDraft({ ...draft, summary_text: v })}
            onCommit={save}
            placeholder="Interpretação do dia…"
            rows={3}
          />
          {upsert.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {upsert.error instanceof Error
                ? upsert.error.message
                : String(upsert.error)}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void save()}
              disabled={upsert.isPending}
            >
              {upsert.isPending ? "Salvando…" : "Salvar registro"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <span className="ml-auto self-center text-[10px] text-faint">
              ⌘Enter salva
            </span>
          </div>
          <p className="text-[11px] text-faint">
            Após salvar, este registro entra em validação e trava em 24h — vira
            história permanente.
          </p>
        </div>
      ) : (
        <div className="record-grid">
          <Block
            title="Planejado"
            items={lines(log.planned_text)}
            empty="Nada planejado."
          />
          <Block
            title="Executado"
            items={lines(log.executed_text)}
            empty="Ainda sem execução registrada."
          />
          <div>
            <p className="record-label">Resumo</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {log.summary_text || "—"}
            </p>
          </div>
        </div>
      )}

      {log.status === "VALIDATING" && (
        <p className="validation-note">
          Correções disponíveis até o fechamento das 24h
        </p>
      )}
      {log.status === "LOCKED" && (
        <p className="archive-note">
          <LockKeyhole />
          Registro Histórico • somente leitura
        </p>
      )}
    </article>
  );
}

function Block({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="record-label">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-faint">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((x) => (
            <li
              key={x}
              className="flex gap-2 text-sm leading-6 text-muted-foreground"
            >
              <Check className="mt-1 size-3.5 shrink-0 text-accent-foreground" />
              {x}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
