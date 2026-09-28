import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  getAvailabilityRules,
  getFreeSlotsForDate,
  getUpcomingMeetingSlots,
  upsertAvailabilityRule,
} from "@/services/profile-service";
import type { AvailabilityRule, DaySlot } from "@/types/profile";

export function useAvailabilityRules() {
  const query = useQuery({
    queryKey: qk.availability(),
    queryFn: getAvailabilityRules,
    staleTime: 60_000,
  });
  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useUpdateAvailabilityRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: AvailabilityRule) => upsertAvailabilityRule(rule),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.availability() });
      void qc.invalidateQueries({ queryKey: qk.meetingRequests() });
      void qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

/** Slots realmente livres de um dia: disponibilidade − compromissos − reuniões aceitas. */
export function useFreeSlots(dateIso: string): {
  window: DaySlot[];
  free: DaySlot[];
  slices: DaySlot[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: [...qk.availability(), "slots", dateIso],
    queryFn: () => getFreeSlotsForDate(dateIso),
    staleTime: 30_000,
  });
  const data = useMemo(
    () => query.data ?? { window: [], free: [], slices: [] },
    [query.data],
  );
  return { ...data, isLoading: query.isLoading };
}

/** Janela pública: slots dos próximos N dias para solicitação de reunião. */
export function useUpcomingMeetingSlots(days = 7): {
  days: Array<{ date: string; slices: DaySlot[]; free: DaySlot[] }>;
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: [...qk.availability(), "upcoming", days],
    queryFn: () => getUpcomingMeetingSlots(days),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  return { days: query.data ?? [], isLoading: query.isLoading };
}
