import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAgendaEvent, getAgendaEvents, saveAgendaEvent } from "@/services/profile-service";
import type { AgendaEvent } from "@/types/profile";

export function useAgendaEvents() {
  const query = useQuery({
    queryKey: ["agenda-events"],
    queryFn: getAgendaEvents,
    staleTime: 30_000,
  });
  return { events: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useSaveAgendaEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: AgendaEvent) => saveAgendaEvent(event),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-events"] }),
  });
}

export function useDeleteAgendaEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAgendaEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-events"] }),
  });
}
