import { useQuery } from "@tanstack/react-query";
import { checkSupabaseHealth } from "@/lib/supabase";
import { qk } from "@/lib/query-keys";

export function useSupabaseHealth() {
  const query = useQuery({
    queryKey: qk.health(),
    queryFn: checkSupabaseHealth,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  return {
    health: (query.data ?? "not-configured") as
      "ok" | "offline" | "not-configured",
    isLoading: query.isLoading,
  };
}
