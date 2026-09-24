import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMilestone, getMilestones } from "@/services/profile-service";
import type { Milestone } from "@/types/profile";

export function useMilestones() {
  const query = useQuery({ queryKey: ["milestones"], queryFn: getMilestones, staleTime: 60_000 });
  return { milestones: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMilestone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones"] }),
  });
}
