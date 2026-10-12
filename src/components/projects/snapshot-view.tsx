import { formatDateTime } from "@/components/projects/status";

/** Rótulos legíveis para os campos congelados nos snapshots. */
const LABELS: Record<string, string> = {
  title: "Título",
  position: "Posição",
  objective: "Objetivo",
  description: "Descrição",
  instructions: "Instruções",
  criteria: "Critérios de conclusão",
  executed_text: "O que foi executado",
  result_text: "Resultado obtido",
  observations: "Observações",
  next_step: "Próximo passo",
  summary: "Resumo do que foi executado",
  result: "Resultado alcançado",
  context: "Contexto",
  completed_at: "Concluído em",
  version: "Versão",
};

const SKIP = new Set([
  "phase_id",
  "project_id",
  "mission_id",
  "subtasks",
  "status",
]);

function renderValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (key === "completed_at")
    return <span>{formatDateTime(String(value))}</span>;
  if (Array.isArray(value)) {
    const items = value.filter((v) => typeof v === "string" && v.trim() !== "");
    if (items.length === 0) return null;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {items.map((v, i) => (
          <li key={i}>{String(v)}</li>
        ))}
      </ul>
    );
  }
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

/** Renderiza um registro congelado (snapshot) de forma legível. */
export function SnapshotView({
  snapshot,
}: {
  snapshot: Record<string, unknown>;
}) {
  const entries = Object.entries(snapshot).filter(([k]) => !SKIP.has(k));
  return (
    <dl className="space-y-3">
      {entries.map(([key, value]) => {
        const rendered = renderValue(key, value);
        if (rendered === null) return null;
        return (
          <div key={key}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              {LABELS[key] ?? key}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-foreground">
              {rendered}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Renderiza a lista de subtarefas de uma fase (planejamento, editável). */
export function SubtaskList({ subtasks }: { subtasks: string[] }) {
  if (subtasks.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
      {subtasks.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}
