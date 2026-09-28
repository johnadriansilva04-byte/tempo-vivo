import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  createWeeklyFocus,
  deleteWeeklyFocus,
  getWeeklyFocus,
  updateWeeklyFocusProgress,
} from "@/services/profile-service";
import type { WeeklyFocus } from "@/types/profile";

export function useWeeklyFocus() {
  const query = useQuery({
    queryKey: qk.weeklyFocus(),
    queryFn: getWeeklyFocus,
    staleTime: 60_000,
  });
  return {
    focus: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Pick<
        WeeklyFocus,
        "title" | "description" | "week_number" | "year"
      >,
    ) => createWeeklyFocus(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.weeklyFocus() }),
  });
}

export function useUpdateFocusProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress_pct }: { id: string; progress_pct: number }) =>
      updateWeeklyFocusProgress(id, progress_pct),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.weeklyFocus() }),
  });
}

export function useDeleteFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWeeklyFocus,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.weeklyFocus() }),
  });
}
