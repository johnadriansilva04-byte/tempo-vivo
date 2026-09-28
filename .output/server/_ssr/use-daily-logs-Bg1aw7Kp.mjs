import { E as upsertDailyLog, S as qk, f as getDailyLogs } from "./button-PJRo-bhb.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-daily-logs-Bg1aw7Kp.js
function useDailyLogs(opts) {
	const query = useQuery({
		queryKey: qk.dailyLogs(),
		queryFn: () => getDailyLogs(opts),
		staleTime: 3e4,
		refetchOnWindowFocus: true
	});
	return {
		logs: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useUpsertDailyLog() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (log) => upsertDailyLog(log),
		onSuccess: (saved) => {
			queryClient.setQueryData(qk.dailyLogs(), (old) => {
				const next = old ? [...old] : [];
				const idx = next.findIndex((l) => l.id === saved.id);
				if (idx === -1) next.push(saved);
				else next[idx] = saved;
				return next.sort((a, b) => b.log_date.localeCompare(a.log_date));
			});
		}
	});
}
//#endregion
export { useUpsertDailyLog as n, useDailyLogs as t };
