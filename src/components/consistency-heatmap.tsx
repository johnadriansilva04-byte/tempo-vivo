import { Activity } from "lucide-react";
import { useConsistency } from "@/hooks/use-consistency";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Heatmap de consistência (20 semanas) — cada célula é um dia registrado. */
export function ConsistencyHeatmap() {
  const { grid, activeDays } = useConsistency(20);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint">
          <Activity className="size-3.5" />
          Consistência
        </p>
        <span className="text-[11px] text-muted-foreground">
          <strong className="text-primary">{activeDays}</strong> dias ativos ·
          20 semanas
        </span>
      </div>

      <TooltipProvider delayDuration={120}>
        <div className="heatmap-scroll flex gap-[3px]">
          {grid.map((week, wi) => {
            const firstOfMonth = week.find(
              (c) => new Date(`${c.date}T00:00:00`).getDate() === 1,
            );
            return (
              <div key={wi} className="flex flex-col gap-[3px]">
                {wi === 0 || firstOfMonth ? (
                  <span className="heatmap-month">
                    {firstOfMonth
                      ? MONTHS[
                          new Date(`${firstOfMonth.date}T00:00:00`).getMonth()
                        ]
                      : ""}
                  </span>
                ) : (
                  <span className="heatmap-month" />
                )}
                {week.map((cell) => (
                  <Tooltip key={cell.date}>
                    <TooltipTrigger asChild>
                      <span
                        className={`heatmap-cell ${cell.level > 0 ? `heatmap-l${cell.level}` : ""}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="px-2 py-1 text-[10px]"
                    >
                      {cell.level === 0
                        ? "sem registro"
                        : `nível ${cell.level}`}{" "}
                      · {cell.date}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-faint">
        menos
        <span className="heatmap-cell" />
        <span className="heatmap-cell heatmap-l1" />
        <span className="heatmap-cell heatmap-l2" />
        <span className="heatmap-cell heatmap-l3" />
        <span className="heatmap-cell heatmap-l4" />
        mais
      </div>
    </div>
  );
}
