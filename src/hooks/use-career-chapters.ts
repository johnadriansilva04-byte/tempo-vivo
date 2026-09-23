import { useQuery } from "@tanstack/react-query";
import { getCareerChapters } from "@/services/profile-service";

export function useCareerChapters() {
  const query = useQuery({
    queryKey: ["career-chapters"],
    queryFn: getCareerChapters,
    staleTime: 60_000,
  });
  return { chapters: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
