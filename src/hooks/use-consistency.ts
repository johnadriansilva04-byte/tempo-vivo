import { useMemo } from "react";
import { useDailyLogs } from "@/hooks/use-daily-logs";

export type HeatCell = {
  date: string; // yyyy-mm-dd
  level: 0 | 1 | 2 | 3 | 4;
};

const LEVELS: Array<[number, HeatCell["level"]]> = [
  [1, 1],
  [2, 2],
  [3, 3],
];

function levelFor(summaryLen: number, executedLen: number): HeatCell["level"] {
  if (summaryLen > 0 && executedLen > 0) return 4;
  if (summaryLen > 0 || executedLen > 0) return 2;
  return 1;
}

/**
 * Heatmap de consistência: últimas 20 semanas (140 dias), estilo GitHub.
 * Nível derivado do que foi realmente registrado no dia.
 */
export function useConsistency(weeks = 20): {
  grid: HeatCell[][];
  activeDays: number;
} {
  const { logs } = useDailyLogs();

  return useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.log_date, l]));
    const msDay = 24 * 60 * 60 * 1000;
    const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);

    const grid: HeatCell[][] = [];
    let activeDays = 0;

    // Alinha o início no domingo da semana mais antiga (colunas = semanas).
    const totalDays = weeks * 7;
    const start = new Date(today.getTime() - (totalDays - 1) * msDay);
    start.setDate(start.getDate() - start.getDay());

    for (let w = 0; w < weeks; w++) {
      const col: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start.getTime() + (w * 7 + d) * msDay);
        const iso = day.toISOString().slice(0, 10);
        const log = byDate.get(iso);
        if (log) {
          const lvl = levelFor(
            log.summary_text.trim().length,
            log.executed_text.trim().length,
          );
          if (lvl >= 1) activeDays += 1;
          col.push({ date: iso, level: lvl });
        } else {
          col.push({ date: iso, level: 0 });
        }
      }
      grid.push(col);
    }

    return { grid, activeDays };
  }, [logs, weeks]);
}
