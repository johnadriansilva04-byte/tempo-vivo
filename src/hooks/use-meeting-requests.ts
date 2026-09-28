import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  createMeetingRequest,
  decideMeetingRequest,
  getMeetingRequests,
} from "@/services/profile-service";
import type { MeetingRequest } from "@/types/profile";

export function useMeetingRequests() {
  const query = useQuery({
    queryKey: qk.meetingRequests(),
    queryFn: getMeetingRequests,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDecideMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: {
        status: "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";
        counter_event_date?: string | null;
        counter_start_time?: string | null;
        counter_end_time?: string | null;
        counter_note?: string;
      };
    }) => decideMeetingRequest(id, decision),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.meetingRequests() });
      void qc.invalidateQueries({ queryKey: qk.oneOffEvents() });
      void qc.invalidateQueries({ queryKey: qk.availability() });
      void qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

/** Visitante do perfil público envia solicitação de reunião. */
export function useCreateMeetingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<
        MeetingRequest,
        | "id"
        | "status"
        | "counter_event_date"
        | "counter_start_time"
        | "counter_end_time"
        | "counter_note"
        | "created_at"
      >,
    ) => createMeetingRequest(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.meetingRequests() });
      void qc.invalidateQueries({ queryKey: qk.availability() });
    },
  });
}
