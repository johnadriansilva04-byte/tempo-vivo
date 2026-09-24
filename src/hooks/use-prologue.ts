import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLifePrologue, setLifePrologue } from "@/services/profile-service";

export function usePrologue() {
  const query = useQuery({ queryKey: ["prologue"], queryFn: getLifePrologue, staleTime: 60_000 });
  return { prologue: query.data ?? "", isLoading: query.isLoading, error: query.error };
}

export function useSetPrologue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setLifePrologue,
    onSuccess: (text) => qc.setQueryData(["prologue"], text),
  });
}
