import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptMeeting,
  declineMeeting,
  listMeetingRequests,
  removeMeetingRequest,
  requestMeeting,
} from "@/services/profile-service";
import type { MeetingRequest } from "@/types/profile";

/** Pedidos de reunião recebidos pelo dono. */
export function useMeetingRequests() {
  const query = useQuery({
    queryKey: ["meeting-requests"],
    queryFn: listMeetingRequests,
    staleTime: 15_000,
  });
  return { requests: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

/** Aceitar cria o compromisso na agenda, então as duas listas são invalidadas. */
export function useAcceptMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: MeetingRequest) => acceptMeeting(request),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["meeting-requests"] });
      void qc.invalidateQueries({ queryKey: ["agenda-events"] });
    },
  });
}

export function useDeclineMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: MeetingRequest) => declineMeeting(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-requests"] }),
  });
}

export function useRemoveMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeMeetingRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-requests"] }),
  });
}

/** Usado pelo visitante no perfil público: envia o pedido. */
export function useRequestMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<MeetingRequest, "id" | "status" | "created_at">) =>
      requestMeeting(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-requests"] }),
  });
}
