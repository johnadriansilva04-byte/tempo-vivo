import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-errors";
import { qk } from "@/lib/query-keys";
import { getProfile, updateProfile } from "@/services/profile-service";
import type { Profile } from "@/types/profile";

export function useProfile() {
  const query = useQuery({
    queryKey: qk.profile(),
    queryFn: getProfile,
    staleTime: 60_000,
    retry: (count, err) => {
      const code = err instanceof ApiError ? err.code : "";
      if (code === "NETWORK" || code === "TIMEOUT") return count < 2;
      return false;
    },
  });
  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<Profile, "id">>) => updateProfile(patch),
    onSuccess: (updated) => queryClient.setQueryData(qk.profile(), updated),
  });
}
