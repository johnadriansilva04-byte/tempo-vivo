import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCareerChapter, getCareerChapters } from "@/services/profile-service";
import type { CareerChapter } from "@/types/profile";

export function useCareerChapters() {
  const query = useQuery({
    queryKey: ["career-chapters"],
    queryFn: getCareerChapters,
    staleTime: 60_000,
  });
  return { chapters: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useCreateCareerChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CareerChapter, "id">) => createCareerChapter(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["career-chapters"] }),
  });
}
