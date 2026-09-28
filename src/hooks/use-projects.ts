import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  deleteProject,
  getProjects,
  upsertProject,
} from "@/services/profile-service";
import type { Project } from "@/types/profile";

export function useProjects() {
  const query = useQuery({
    queryKey: qk.projects(),
    queryFn: getProjects,
    staleTime: 60_000,
  });
  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects() }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects() }),
  });
}
