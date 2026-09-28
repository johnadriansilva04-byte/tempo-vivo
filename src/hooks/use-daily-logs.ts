import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { getDailyLogs, upsertDailyLog } from "@/services/profile-service";
import type { DailyLog } from "@/types/profile";

export function useDailyLogs(opts?: { limit?: number }) {
  const query = useQuery({
    queryKey: qk.dailyLogs(),
    queryFn: () => getDailyLogs(opts),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpsertDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (log: DailyLog) => upsertDailyLog(log),
    onSuccess: (saved) => {
      queryClient.setQueryData<DailyLog[]>(qk.dailyLogs(), (old) => {
        const next = old ? [...old] : [];
        const idx = next.findIndex((l) => l.id === saved.id);
        if (idx === -1) next.push(saved);
        else next[idx] = saved;
        return next.sort((a, b) => b.log_date.localeCompare(a.log_date));
      });
    },
  });
}

export function useOpenTodayLog() {
  const upsert = useUpsertDailyLog();
  return {
    openToday: () => {
      const today = new Date().toISOString().slice(0, 10);
      return upsert.mutateAsync({
        id: `log-${today}-${Date.now()}`,
        log_date: today,
        planned_text: "",
        executed_text: "",
        summary_text: "",
        status: "OPEN",
        locked_at: null,
        created_at: new Date().toISOString(),
      });
    },
    isPending: upsert.isPending,
  };
}
