import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  addFamilyMember,
  getFamilyMembers,
  removeFamilyMember,
  updateFamilyMember,
} from "@/services/profile-service";
import type { FamilyMember, ProfilePrivacy } from "@/types/profile";

export function useFamilyMembers() {
  const query = useQuery({
    queryKey: qk.family(),
    queryFn: getFamilyMembers,
    staleTime: 60_000,
  });
  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAddFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      display_name: string;
      phone: string;
      relation: FamilyMember["relation"];
      privacy: ProfilePrivacy;
      note: string;
    }) => addFamilyMember(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.family() });
      void qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

export function useUpdateFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Pick<FamilyMember, "privacy"> &
        Partial<Pick<FamilyMember, "display_name" | "note" | "relation">>;
    }) => updateFamilyMember(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.family() });
      void qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

export function useRemoveFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.family() });
      void qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}
