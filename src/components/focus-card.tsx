import { useState } from "react";
import { Target } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useUpdateFocusProgress, useWeeklyFocus } from "@/hooks/use-weekly-focus";
import type { WeeklyFocus } from "@/types/profile";

function FocusCardItem({ item }: { item: WeeklyFocus }) {
  const update = useUpdateFocusProgress();
  const [value, setValue] = useState(item.progress_pct);

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
        </div>
        <span className="font-display text-lg font-semibold text-primary">{value}%</span>
      </div>
      <div className="focus-bar mt-3">
        <div className="focus-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-3">
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={5}
          onValueChange={(arr) => setValue(arr[0] ?? 0)}
          onValueCommit={(arr) => update.mutate({ id: item.id, progress_pct: arr[0] ?? 0 })}
        />
      </div>
    </div>
  );
}

/** Metas semanais com barra de progresso em % (editável inline). */
export function FocusCard() {
  const { focus, isLoading } = useWeeklyFocus();

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />;
  }
  if (focus.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Target className="mx-auto size-5 text-faint" />
        <p className="mt-3 text-sm text-muted-foreground">Sem metas para esta semana.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {focus.map((item) => (
        <FocusCardItem key={item.id} item={item} />
      ))}
    </div>
  );
}
