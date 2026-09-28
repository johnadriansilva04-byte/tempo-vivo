import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  createCareerChapter,
  getCareerChapters,
} from "@/services/profile-service";
import type { CareerChapter } from "@/types/profile";

export function useCareerChapters() {
  const query = useQuery({
    queryKey: qk.careerChapters(),
    queryFn: getCareerChapters,
    staleTime: 60_000,
  });
  return {
    chapters: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateCareerChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CareerChapter, "id">) =>
      createCareerChapter(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.careerChapters() }),
  });
}
