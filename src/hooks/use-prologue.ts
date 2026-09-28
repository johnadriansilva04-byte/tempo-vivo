import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { getLifePrologue, setLifePrologue } from "@/services/profile-service";

export function usePrologue() {
  const query = useQuery({
    queryKey: qk.prologue(),
    queryFn: getLifePrologue,
    staleTime: 60_000,
  });
  return {
    prologue: query.data ?? "",
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSetPrologue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setLifePrologue,
    onSuccess: (text) => qc.setQueryData(qk.prologue(), text),
  });
}
