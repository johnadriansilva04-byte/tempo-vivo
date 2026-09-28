import { S as qk, h as getProfile, t as ApiError, w as updateProfile } from "./button-PJRo-bhb.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-profile-CwIeOr50.js
function useProfile() {
	const query = useQuery({
		queryKey: qk.profile(),
		queryFn: getProfile,
		staleTime: 6e4,
		retry: (count, err) => {
			const code = err instanceof ApiError ? err.code : "";
			if (code === "NETWORK" || code === "TIMEOUT") return count < 2;
			return false;
		}
	});
	return {
		profile: query.data ?? null,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch
	};
}
function useUpdateProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (patch) => updateProfile(patch),
		onSuccess: (updated) => queryClient.setQueryData(qk.profile(), updated)
	});
}
//#endregion
export { useUpdateProfile as n, useProfile as t };
