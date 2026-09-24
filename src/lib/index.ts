// Export central de todos os sistemas locais 100% self-hosted
// Sem dependências externas, zero custo

// Analytics de Produto Local
export { localAnalytics } from './local-analytics';

// Análise de Sentimento
export { analyzeSentiment, getSentimentTrend } from './sentiment-analysis';

// IA Recomendações Rule-Based
export { generateRecommendations } from './ai-recommendations';
export type { Recommendation, RecommendationType, UserContext } from './ai-recommendations';

// Predição de Produtividade
export { predictProductivity, predictNextWeek, getProductivityInsights } from './productivity-prediction';
export type { ProductivityData, PredictionResult } from './productivity-prediction';

// Sistema de Temas
export { themeManager, useTheme } from './theme-system';
export type { ThemePreset, ColorScheme } from './theme-system';

// Backup Criptografado
export { encryptedBackup } from './encrypted-backup';
export type { BackupData, BackupInfo } from './encrypted-backup';

// Keyboard Shortcuts
export { keyboardShortcuts, useKeyboardShortcuts } from './keyboard-shortcuts';
export type { ShortcutAction, ShortcutConfig, ShortcutBinding } from './keyboard-shortcuts';

// Sistema de Automações
export { automationSystem, useAutomations } from './automation-system';
export type { Automation, AutomationTrigger, AutomationAction, AutomationCondition, AutomationContext } from './automation-system';

// Busca Indexada Local
export { localSearch, useLocalSearch } from './local-search';
export type { SearchableItem, SearchResult } from './local-search';

// Sistema de Onboarding
export { onboardingSystem, useOnboarding } from './onboarding-system';
export type { OnboardingStep, OnboardingProgress } from './onboarding-system';

// Feature Flags (já existente)
export { isFeatureEnabled, getFeatureFlags, getFeatureFlag, useFeatureFlag } from './feature-flags';

// Sentiment Analysis Types
export type { SentimentType, SentimentResult } from './sentiment-analysis';