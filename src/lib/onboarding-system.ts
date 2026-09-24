// Sistema de Onboarding Guiado 100% Local
// Sem dependências externas

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'action' | 'interactive';
  target?: string; // CSS selector for element to highlight
  action?: () => Promise<boolean>; // Returns true if completed
  completed: boolean;
  order: number;
  required: boolean;
};

type OnboardingProgress = {
  currentStep: string;
  completedSteps: string[];
  startedAt: number;
  completedAt?: number;
  skipped: boolean;
};

class OnboardingSystem {
  private steps: Map<string, OnboardingStep> = new Map();
  private progress: OnboardingProgress;
  private readonly STORAGE_KEY = 'perfil-vivo:onboarding';

  constructor() {
    this.progress = this.loadProgress();
    this.setupDefaultSteps();
  }

  private loadProgress(): OnboardingProgress {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading onboarding progress:', e);
    }

    return {
      currentStep: 'welcome',
      completedSteps: [],
      startedAt: Date.now(),
      skipped: false,
    };
  }

  private saveProgress() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Error saving onboarding progress:', e);
    }
  }

  private setupDefaultSteps() {
    const defaultSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Perfil Vivo',
        description: 'Seu companion pessoal para registrar e transformar sua jornada de vida.',
        type: 'info',
        completed: false,
        order: 1,
        required: true,
      },
      {
        id: 'create_first_log',
        title: 'Crie seu primeiro registro',
        description: 'Vá até a Agenda e registre suas intenções para hoje.',
        type: 'action',
        target: '[href="/agenda"]',
        completed: false,
        order: 2,
        required: true,
      },
      {
        id: 'explore_dashboard',
        title: 'Explore o Dashboard',
        description: 'Conheça o painel principal onde você acompanha seu progresso.',
        type: 'interactive',
        target: '[href="/"]',
        completed: false,
        order: 3,
        required: true,
      },
      {
        id: 'create_project',
        title: 'Crie seu primeiro projeto',
        description: 'Projetos ajudam a organizar seus objetivos de longo prazo.',
        type: 'action',
        target: '[href="/projetos"]',
        completed: false,
        order: 4,
        required: false,
      },
      {
        id: 'set_weekly_focus',
        title: 'Defina seu foco semanal',
        description: 'Estabeleça suas prioridades para a semana.',
        type: 'action',
        target: '[href="/planejamento"]',
        completed: false,
        order: 5,
        required: false,
      },
      {
        id: 'explore_analytics',
        title: 'Descubra seus insights',
        description: 'O Analytics mostra padrões e tendências da sua produtividade.',
        type: 'interactive',
        target: '[href="/analytics"]',
        completed: false,
        order: 6,
        required: false,
      },
      {
        id: 'try_gamification',
        title: 'Experimente a gamificação',
        description: 'Conquistas e streaks tornam sua jornada mais divertida.',
        type: 'interactive',
        target: '[href="/gamification"]',
        completed: false,
        order: 7,
        required: false,
      },
      {
        id: 'complete_onboarding',
        title: 'Parabéns!',
        description: 'Você completou o onboarding básico. Continue explorando!',
        type: 'info',
        completed: false,
        order: 8,
        required: true,
      },
    ];

    defaultSteps.forEach(step => {
      this.steps.set(step.id, step);
    });
  }

  addStep(step: OnboardingStep): void {
    this.steps.set(step.id, step);
  }

  removeStep(id: string): void {
    this.steps.delete(id);
  }

  getStep(id: string): OnboardingStep | undefined {
    return this.steps.get(id);
  }

  getCurrentStep(): OnboardingStep | undefined {
    return this.steps.get(this.progress.currentStep);
  }

  getNextStep(): OnboardingStep | undefined {
    const current = this.getCurrentStep();
    if (!current) return undefined;

    const nextOrder = current.order + 1;
    const steps = Array.from(this.steps.values())
      .filter(s => s.order === nextOrder)
      .sort((a, b) => a.order - b.order);

    return steps[0];
  }

  getPreviousStep(): OnboardingStep | undefined {
    const current = this.getCurrentStep();
    if (!current) return undefined;

    const prevOrder = current.order - 1;
    const steps = Array.from(this.steps.values())
      .filter(s => s.order === prevOrder)
      .sort((a, b) => a.order - b.order);

    return steps[0];
  }

  getAllSteps(): OnboardingStep[] {
    return Array.from(this.steps.values()).sort((a, b) => a.order - b.order);
  }

  getRequiredSteps(): OnboardingStep[] {
    return this.getAllSteps().filter(s => s.required);
  }

  getOptionalSteps(): OnboardingStep[] {
    return this.getAllSteps().filter(s => !s.required);
  }

  completeStep(id: string): void {
    const step = this.steps.get(id);
    if (step) {
      step.completed = true;
      this.progress.completedSteps.push(id);
      
      const next = this.getNextStep();
      if (next) {
        this.progress.currentStep = next.id;
      } else {
        this.progress.completedAt = Date.now();
      }
      
      this.saveProgress();
    }
  }

  skipStep(id: string): void {
    const step = this.steps.get(id);
    if (step && !step.required) {
      step.completed = true;
      this.progress.completedSteps.push(id);
      
      const next = this.getNextStep();
      if (next) {
        this.progress.currentStep = next.id;
      }
      
      this.saveProgress();
    }
  }

  goToStep(id: string): void {
    const step = this.steps.get(id);
    if (step) {
      this.progress.currentStep = id;
      this.saveProgress();
    }
  }

  nextStep(): void {
    const next = this.getNextStep();
    if (next) {
      this.goToStep(next.id);
    }
  }

  previousStep(): void {
    const prev = this.getPreviousStep();
    if (prev) {
      this.goToStep(prev.id);
    }
  }

  skipOnboarding(): void {
    this.progress.skipped = true;
    this.progress.completedAt = Date.now();
    this.saveProgress();
  }

  restartOnboarding(): void {
    this.progress = {
      currentStep: 'welcome',
      completedSteps: [],
      startedAt: Date.now(),
      skipped: false,
    };
    
    // Reset all steps
    this.steps.forEach(step => {
      step.completed = false;
    });
    
    this.saveProgress();
  }

  isOnboardingComplete(): boolean {
    const requiredSteps = this.getRequiredSteps();
    return requiredSteps.every(step => step.completed);
  }

  isOnboardingSkipped(): boolean {
    return this.progress.skipped;
  }

  getProgress(): {
    current: number;
    total: number;
    percentage: number;
  } {
    const total = this.steps.size;
    const completed = this.progress.completedSteps.length;
    
    return {
      current: completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  shouldShowOnboarding(): boolean {
    // Show if not completed and not skipped
    return !this.isOnboardingComplete() && !this.isOnboardingSkipped();
  }

  getOnboardingDuration(): number {
    if (!this.progress.completedAt) return 0;
    return this.progress.completedAt - this.progress.startedAt;
  }

  resetProgress(): void {
    this.progress = {
      currentStep: 'welcome',
      completedSteps: [],
      startedAt: Date.now(),
      skipped: false,
    };
    this.saveProgress();
  }
}

// Singleton instance
export const onboardingSystem = new OnboardingSystem();

// React hook for onboarding
export function useOnboarding() {
  return {
    currentStep: onboardingSystem.getCurrentStep(),
    nextStep: onboardingSystem.getNextStep(),
    previousStep: onboardingSystem.getPreviousStep(),
    allSteps: onboardingSystem.getAllSteps(),
    requiredSteps: onboardingSystem.getRequiredSteps(),
    optionalSteps: onboardingSystem.getOptionalSteps(),
    complete: (id: string) => onboardingSystem.completeStep(id),
    skip: (id: string) => onboardingSystem.skipStep(id),
    goTo: (id: string) => onboardingSystem.goToStep(id),
    next: () => onboardingSystem.nextStep(),
    previous: () => onboardingSystem.previousStep(),
    skipOnboarding: () => onboardingSystem.skipOnboarding(),
    restart: () => onboardingSystem.restartOnboarding(),
    isComplete: () => onboardingSystem.isOnboardingComplete(),
    isSkipped: () => onboardingSystem.isOnboardingSkipped(),
    shouldShow: () => onboardingSystem.shouldShowOnboarding(),
    getProgress: () => onboardingSystem.getProgress(),
    getDuration: () => onboardingSystem.getOnboardingDuration(),
    reset: () => onboardingSystem.resetProgress(),
  };
}

export type { OnboardingStep, OnboardingProgress };