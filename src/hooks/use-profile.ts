import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/services/profile-service";
import type { Profile } from "@/types/profile";

export function useProfile() {
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 60_000,
  });
  return { profile: query.data ?? null, isLoading: query.isLoading, error: query.error };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<Profile, "id">>) => updateProfile(patch),
    onSuccess: (updated) => queryClient.setQueryData(["profile"], updated),
  });
}
