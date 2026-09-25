import { useQuery } from "@tanstack/react-query";
import { listPublicProfiles } from "@/services/profile-service";

export function useNetwork() {
  const query = useQuery({
    queryKey: ["public-network"],
    queryFn: listPublicProfiles,
    staleTime: 30_000,
  });
  return { people: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
