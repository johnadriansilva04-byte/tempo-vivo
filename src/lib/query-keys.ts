/** Chaves react-query centralizadas — evita string solta e facilita invalidação. */
export const qk = {
  profile: () => ["profile"] as const,
  health: () => ["supabase-health"] as const,
  commitments: () => ["recurring-commitments"] as const,
  exceptions: () => ["commitment-exceptions"] as const,
  oneOffEvents: () => ["one-off-events"] as const,
  availability: () => ["availability-rules"] as const,
  meetingRequests: () => ["meeting-requests"] as const,
  publicProfile: (slug: string) => ["public-profile", slug] as const,
} as const;
