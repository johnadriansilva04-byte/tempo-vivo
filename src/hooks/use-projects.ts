import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteProject, getProjects, upsertProject } from "@/services/profile-service";
import type { Project } from "@/types/profile";

export function useProjects() {
  const query = useQuery({ queryKey: ["projects"], queryFn: getProjects, staleTime: 60_000 });
  return { projects: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useUpsertProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteProject(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
