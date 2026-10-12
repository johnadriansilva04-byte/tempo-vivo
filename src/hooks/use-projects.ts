import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  addAttachment,
  addMissionComplement,
  addMissionDependency,
  concludeMission,
  concludePhase,
  createMission,
  createPhase,
  createProject,
  deleteAttachment,
  deleteMission,
  deletePhase,
  getBundle,
  listProjects,
  pauseMission,
  resumeMission,
  startMission,
  startPhase,
  substituteMission,
  updateMission,
  updatePhase,
  updateProjectContext,
} from "@/services/project-service";
import type { ProjectPhase } from "@/types/projects";

export function useProjects() {
  const query = useQuery({
    queryKey: qk.projects(),
    queryFn: listProjects,
    staleTime: 30_000,
  });
  return {
    summaries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProject(projectId: string) {
  const query = useQuery({
    queryKey: qk.project(projectId),
    queryFn: () => getBundle(projectId),
    staleTime: 15_000,
    enabled: projectId !== "",
  });
  return {
    bundle: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Invalida a lista e o projeto afetado após qualquer escrita. */
function useProjectInvalidation(projectId?: string) {
  const qc = useQueryClient();
  return async () => {
    await qc.invalidateQueries({ queryKey: qk.projects() });
    if (projectId)
      await qc.invalidateQueries({ queryKey: qk.project(projectId) });
  };
}

export function useCreateProject() {
  const invalidate = useProjectInvalidation();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateProjectContext(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: { context: string; reason?: string }) =>
      updateProjectContext(projectId, input.context, input.reason ?? ""),
    onSuccess: () => invalidate(),
  });
}

export function useCreatePhase(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: Parameters<typeof createPhase>[0]) =>
      createPhase(input),
    onSuccess: () => invalidate(),
  });
}

export function useStartPhase(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (phaseId: string) => startPhase(phaseId),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePhase(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      phaseId: string;
      patch: Partial<
        Pick<
          ProjectPhase,
          | "title"
          | "objective"
          | "description"
          | "instructions"
          | "criteria"
          | "subtasks"
          | "executed_text"
          | "result_text"
          | "observations"
          | "next_step"
        >
      >;
    }) => updatePhase(input.phaseId, input.patch),
    onSuccess: () => invalidate(),
  });
}

export function useConcludePhase(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      phaseId: string;
      final: {
        executed?: string;
        result?: string;
        observations?: string;
        next_step?: string;
      };
    }) => concludePhase(input.phaseId, input.final),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePhase(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (phaseId: string) => deletePhase(phaseId),
    onSuccess: () => invalidate(),
  });
}

export function useCreateMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: Parameters<typeof createMission>[0]) =>
      createMission(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      missionId: string;
      patch: {
        title?: string;
        description?: string;
        context?: string;
        objective?: string;
      };
      reason?: string;
    }) => updateMission(input.missionId, input.patch, input.reason ?? ""),
    onSuccess: () => invalidate(),
  });
}

export function useSubstituteMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      missionId: string;
      title: string;
      description?: string;
      context?: string;
      objective?: string;
      reason?: string;
    }) => {
      const { missionId, ...rest } = input;
      return substituteMission(missionId, rest);
    },
    onSuccess: () => invalidate(),
  });
}

export function useConcludeMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      missionId: string;
      final: {
        summary?: string;
        result?: string;
        observations?: string;
        next_step?: string;
      };
    }) => concludeMission(input.missionId, input.final),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (missionId: string) => deleteMission(missionId),
    onSuccess: () => invalidate(),
  });
}

export function useStartMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (missionId: string) => startMission(missionId),
    onSuccess: () => invalidate(),
  });
}

export function usePauseMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (missionId: string) => pauseMission(missionId),
    onSuccess: () => invalidate(),
  });
}

export function useResumeMission(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (missionId: string) => resumeMission(missionId),
    onSuccess: () => invalidate(),
  });
}

export function useAddMissionDependency(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: { missionId: string; dependsOnMissionId: string }) =>
      addMissionDependency(input.missionId, input.dependsOnMissionId),
    onSuccess: () => invalidate(),
  });
}

export function useAddMissionComplement(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: {
      missionId: string;
      content: string;
      reason?: string;
    }) =>
      addMissionComplement(input.missionId, input.content, input.reason ?? ""),
    onSuccess: () => invalidate(),
  });
}

export function useAddAttachment(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (input: Parameters<typeof addAttachment>[0]) =>
      addAttachment(input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteAttachment(projectId: string) {
  const invalidate = useProjectInvalidation(projectId);
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: () => invalidate(),
  });
}
