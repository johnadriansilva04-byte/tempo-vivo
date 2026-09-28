/** Chaves react-query centralizadas — evita string solta e facilita invalidação. */
export const qk = {
  profile: () => ["profile"] as const,
  dailyLogs: () => ["daily-logs"] as const,
  prologue: () => ["prologue"] as const,
  weeklyFocus: () => ["weekly-focus"] as const,
  careerChapters: () => ["career-chapters"] as const,
  projects: () => ["projects"] as const,
  milestones: () => ["milestones"] as const,
  timeCapsules: () => ["time-capsules"] as const,
  health: () => ["supabase-health"] as const,
  // Fase 2: agenda real, disponibilidade, reuniões, família, perfil público
  commitments: () => ["recurring-commitments"] as const,
  exceptions: () => ["commitment-exceptions"] as const,
  oneOffEvents: () => ["one-off-events"] as const,
  availability: () => ["availability-rules"] as const,
  meetingRequests: () => ["meeting-requests"] as const,
  family: () => ["family-members"] as const,
  publicProfile: (slug: string) => ["public-profile", slug] as const,
} as const;
