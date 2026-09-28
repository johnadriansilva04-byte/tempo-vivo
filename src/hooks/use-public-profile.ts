import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { getPublicProfileBySlug } from "@/services/profile-service";

/** Janela pública do visitante: bundle completo montado no serviço. */
export function usePublicProfile(slug: string) {
  const query = useQuery({
    queryKey: qk.publicProfile(slug),
    queryFn: () => getPublicProfileBySlug(slug),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return {
    bundle: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
