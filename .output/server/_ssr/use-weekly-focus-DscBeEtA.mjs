import { D as upsertProject, S as qk, T as updateWeeklyFocusProgress, _ as getTimeCapsules, c as createTimeCapsule, g as getProjects, l as createWeeklyFocus, m as getMilestones, s as createMilestone, v as getWeeklyFocus, x as openTimeCapsule } from "./button-PJRo-bhb.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-weekly-focus-DscBeEtA.js
function useMilestones() {
	const query = useQuery({
		queryKey: qk.milestones(),
		queryFn: getMilestones,
		staleTime: 6e4
	});
	return {
		milestones: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useCreateMilestone() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: createMilestone,
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.milestones() })
	});
}
function useProjects() {
	const query = useQuery({
		queryKey: qk.projects(),
		queryFn: getProjects,
		staleTime: 6e4
	});
	return {
		projects: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useUpsertProject() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: upsertProject,
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects() })
	});
}
function useTimeCapsules() {
	const query = useQuery({
		queryKey: qk.timeCapsules(),
		queryFn: getTimeCapsules,
		staleTime: 6e4,
		refetchOnWindowFocus: true
	});
	return {
		capsules: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useCreateCapsule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input) => createTimeCapsule(input),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.timeCapsules() })
	});
}
function useOpenCapsule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id) => openTimeCapsule(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.timeCapsules() })
	});
}
function useWeeklyFocus() {
	const query = useQuery({
		queryKey: qk.weeklyFocus(),
		queryFn: getWeeklyFocus,
		staleTime: 6e4
	});
	return {
		focus: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useCreateFocus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input) => createWeeklyFocus(input),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.weeklyFocus() })
	});
}
function useUpdateFocusProgress() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, progress_pct }) => updateWeeklyFocusProgress(id, progress_pct),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.weeklyFocus() })
	});
}
//#endregion
export { useOpenCapsule as a, useUpdateFocusProgress as c, useMilestones as i, useUpsertProject as l, useCreateFocus as n, useProjects as o, useCreateMilestone as r, useTimeCapsules as s, useCreateCapsule as t, useWeeklyFocus as u };
