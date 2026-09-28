import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { occurrencesForDate, todayIso, addDaysIso } from "@/lib/schedule";
import {
  deleteCommitmentException,
  deleteOneOffEvent,
  deleteRecurringCommitment,
  getCommitmentExceptions,
  getOneOffEvents,
  getRecurringCommitments,
  upsertCommitmentException,
  upsertOneOffEvent,
  upsertRecurringCommitment,
} from "@/services/profile-service";
import type {
  CommitmentException,
  OneOffEvent,
  RecurringCommitment,
  ScheduleOccurrence,
} from "@/types/profile";

export function useRecurringCommitments() {
  const query = useQuery({
    queryKey: qk.commitments(),
    queryFn: getRecurringCommitments,
    staleTime: 60_000,
  });
  return {
    commitments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpsertCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<RecurringCommitment, "id" | "created_at"> & { id?: string },
    ) => upsertRecurringCommitment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.commitments() }),
  });
}

export function useDeleteCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringCommitment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.commitments() });
      void qc.invalidateQueries({ queryKey: qk.exceptions() });
    },
  });
}

export function useCommitmentExceptions() {
  const query = useQuery({
    queryKey: qk.exceptions(),
    queryFn: getCommitmentExceptions,
    staleTime: 60_000,
  });
  return { exceptions: query.data ?? [], isLoading: query.isLoading };
}

export function useUpsertException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CommitmentException, "id">) =>
      upsertCommitmentException(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.exceptions() }),
  });
}

export function useDeleteException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCommitmentException,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.exceptions() }),
  });
}

export function useOneOffEvents() {
  const query = useQuery({
    queryKey: qk.oneOffEvents(),
    queryFn: getOneOffEvents,
    staleTime: 60_000,
  });
  return { events: query.data ?? [], isLoading: query.isLoading };
}

export function useUpsertOneOffEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<OneOffEvent, "id" | "source" | "meeting_request_id"> & {
        id?: string;
        source?: "manual" | "meeting";
        meeting_request_id?: string | null;
      },
    ) => upsertOneOffEvent(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.oneOffEvents() }),
  });
}

export function useDeleteOneOffEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOneOffEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.oneOffEvents() }),
  });
}

/** Ocorrências concretas de uma data (regra + exceção + eventos + reuniões aceitas). */
export function useDayOccurrences(dateIso: string): {
  occurrences: ScheduleOccurrence[];
  isLoading: boolean;
} {
  const { commitments, isLoading: l1 } = useRecurringCommitments();
  const { exceptions, isLoading: l2 } = useCommitmentExceptions();
  const { events, isLoading: l3 } = useOneOffEvents();

  const occurrences = useMemo(
    () => occurrencesForDate(dateIso, commitments, exceptions, events),
    [dateIso, commitments, exceptions, events],
  );
  return { occurrences, isLoading: l1 || l2 || l3 };
}

/** HOJE e AMANHÃ — a primeira experiência do dono e do visitante. */
export function useTodayTomorrow(): {
  today: string;
  tomorrow: string;
  occurrencesToday: ScheduleOccurrence[];
  occurrencesTomorrow: ScheduleOccurrence[];
  isLoading: boolean;
} {
  const today = todayIso();
  const tomorrow = addDaysIso(today, 1);
  const a = useDayOccurrences(today);
  const b = useDayOccurrences(tomorrow);
  return {
    today,
    tomorrow,
    occurrencesToday: a.occurrences,
    occurrencesTomorrow: b.occurrences,
    isLoading: a.isLoading || b.isLoading,
  };
}
