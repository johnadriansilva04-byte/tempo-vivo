import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyLogs, upsertDailyLog } from "@/services/profile-service";
import type { DailyLog } from "@/types/profile";

export function useDailyLogs() {
  const query = useQuery({
    queryKey: ["daily-logs"],
    queryFn: getDailyLogs,
    staleTime: 30_000,
    // Revalida ao voltar pra aba: a regra de 24h evolui com o relógio.
    refetchOnWindowFocus: true,
  });
  return { logs: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useUpsertDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (log: DailyLog) => upsertDailyLog(log),
    onSuccess: (saved) => {
      queryClient.setQueryData<DailyLog[]>(["daily-logs"], (old) => {
        const next = old ? [...old] : [];
        const idx = next.findIndex((l) => l.id === saved.id);
        if (idx === -1) next.push(saved);
        else next[idx] = saved;
        return next.sort((a, b) => b.log_date.localeCompare(a.log_date));
      });
    },
  });
}
