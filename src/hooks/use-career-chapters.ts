import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCareerChapter,
  deleteCareerChapter,
  getCareerChapters,
} from "@/services/profile-service";
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

export function useDeleteCareerChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCareerChapter(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["career-chapters"] }),
  });
}
