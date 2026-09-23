import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWeeklyFocus, updateWeeklyFocusProgress } from "@/services/profile-service";
import type { WeeklyFocus } from "@/types/profile";

export function useWeeklyFocus() {
  const query = useQuery({
    queryKey: ["weekly-focus"],
    queryFn: getWeeklyFocus,
    staleTime: 60_000,
  });
  return { focus: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useUpdateFocusProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress_pct }: { id: string; progress_pct: number }) =>
      updateWeeklyFocusProgress(id, progress_pct),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weekly-focus"] }),
  });
}

export function useWeeks(): { week: number; year: number } {
  const now = new Date();
  return { week: currentWeekNumber(now), year: now.getFullYear() };
}

export function currentWeekNumber(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

export function focusForCurrentWeek(items: WeeklyFocus[], date: Date = new Date()): WeeklyFocus[] {
  const week = currentWeekNumber(date);
  const year = date.getFullYear();
  return items.filter((f) => f.week_number === week && f.year === year);
}
