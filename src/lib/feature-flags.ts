type FeatureFlag = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
};

const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  voice_input: {
    id: "voice_input",
    name: "Voice Input",
    description: "Dictation support for daily logs",
    enabled: true,
  },
  google_calendar_integration: {
    id: "google_calendar_integration",
    name: "Google Calendar Integration",
    description: "Sync tasks with Google Calendar",
    enabled: true,
  },
  advanced_analytics: {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Detailed productivity analytics and charts",
    enabled: true,
  },
  gamification: {
    id: "gamification",
    name: "Gamification",
    description: "Achievements, streaks, and XP system",
    enabled: true,
  },
  real_time_sync: {
    id: "real_time_sync",
    name: "Real-time Sync",
    description: "Live data synchronization",
    enabled: false,
    rolloutPercentage: 10,
  },
  export_features: {
    id: "export_features",
    name: "Export Features",
    description: "PDF, JSON, and CSV export options",
    enabled: true,
  },
  dark_mode_enhancements: {
    id: "dark_mode_enhancements",
    name: "Dark Mode Enhancements",
    description: "Improved dark mode experience",
    enabled: true,
  },
  mobile_optimizations: {
    id: "mobile_optimizations",
    name: "Mobile Optimizations",
    description: "Enhanced mobile experience",
    enabled: true,
  },
};

export function isFeatureEnabled(featureId: string): boolean {
  const flag = FEATURE_FLAGS[featureId];
  if (!flag) return false;

  if (!flag.enabled) return false;

  // For features with gradual rollout
  if (flag.rolloutPercentage) {
    const hash = hashUserId();
    return hash < flag.rolloutPercentage;
  }

  return true;
}

export function getFeatureFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS);
}

export function getFeatureFlag(id: string): FeatureFlag | undefined {
  return FEATURE_FLAGS[id];
}

// Simple hash function for user-based rollout
function hashUserId(): number {
  // In a real implementation, this would use the actual user ID
  // For now, we'll use a random value
  const userId = localStorage.getItem('feature_flag_user_id') || Math.random().toString(36).substring(7);
  localStorage.setItem('feature_flag_user_id', userId);
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash) % 100;
}

// Hook for React components
export function useFeatureFlag(featureId: string): boolean {
  return isFeatureEnabled(featureId);
}