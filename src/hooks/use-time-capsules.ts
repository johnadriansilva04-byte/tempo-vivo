import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  createTimeCapsule,
  getTimeCapsules,
  openTimeCapsule,
} from "@/services/profile-service";

export function useTimeCapsules() {
  const query = useQuery({
    queryKey: qk.timeCapsules(),
    queryFn: getTimeCapsules,
    staleTime: 60_000,
    // O relógio decide o que pode abrir — revalida ao voltar pra aba.
    refetchOnWindowFocus: true,
  });
  return {
    capsules: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateCapsule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      content: string;
      unlock_at: string;
    }) => createTimeCapsule(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.timeCapsules() }),
  });
}

export function useOpenCapsule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => openTimeCapsule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.timeCapsules() }),
  });
}
