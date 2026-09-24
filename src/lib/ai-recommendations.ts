// Sistema de IA Recomendação 100% Local - Rule-Based
// Sem dependências externas, totalmente self-hosted

type RecommendationType = 
  | 'task_suggestion'
  | 'time_allocation'
  | 'focus_area'
  | 'break_reminder'
  | 'goal_adjustment'
  | 'routine_optimization'
  | 'energy_management'
  | 'skill_development';

type Recommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  basedOn: string[];
  estimatedImpact: string;
};

type UserContext = {
  recentLogs: Array<{
    log_date: string;
    planned_text: string;
    executed_text: string;
    summary_text: string;
  }>;
  currentStreak: number;
  avgProductivity: number;
  mostProductiveDay: number;
  completionRate: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  activeProjects: number;
  completedProjects: number;
  lastActivity: string;
};

class LocalAIRecommendations {
  private context: UserContext;
  private recommendations: Recommendation[] = [];

  constructor(context: UserContext) {
    this.context = context;
    this.generateRecommendations();
  }

  private generateRecommendations() {
    this.recommendations = [
      ...this.analyzeProductivityPatterns(),
      ...this.analyzeTaskCompletion(),
      ...this.analyzeEnergyLevels(),
      ...this.analyzeFocusAreas(),
      ...this.analyzeSentiment(),
      ...this.analyzeStreak(),
      ...this.analyzeProjects(),
    ];
  }

  private analyzeProductivityPatterns(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Detect low productivity days
    if (this.context.avgProductivity < 100) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'routine_optimization',
        title: 'Otimizar rotina matinal',
        description: 'Sua produtividade média está abaixo do ideal. Tente adicionar 30 minutos de planejamento ao início do dia.',
        priority: 'high',
        confidence: 0.8,
        actionable: true,
        basedOn: ['avgProductivity'],
        estimatedImpact: '+25% de produtividade',
      });
    }

    // Detect best performing day
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    if (this.context.mostProductiveDay !== -1) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'time_allocation',
        title: `Aproveitar ${dayNames[this.context.mostProductiveDay]}`,
        description: `Seu dia mais produtivo é ${dayNames[this.context.mostProductiveDay]}. Planeje suas tarefas mais importantes para esse dia.`,
        priority: 'medium',
        confidence: 0.9,
        actionable: true,
        basedOn: ['mostProductiveDay'],
        estimatedImpact: '+40% de eficácia',
      });
    }

    return recommendations;
  }

  private analyzeTaskCompletion(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Low completion rate
    if (this.context.completionRate < 0.5) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'goal_adjustment',
        title: 'Ajustar metas diárias',
        description: 'Você está completando menos de 50% das tarefas planejadas. Tente reduzir o número de tarefas e focar no essencial.',
        priority: 'high',
        confidence: 0.85,
        actionable: true,
        basedOn: ['completionRate'],
        estimatedImpact: '+60% de conclusão',
      });
    }

    // High completion rate - suggest more ambitious goals
    if (this.context.completionRate > 0.8) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'goal_adjustment',
        title: 'Aumentar metas',
        description: 'Você está superando suas metas! Considere adicionar 1-2 tarefas adicionais para crescer ainda mais.',
        priority: 'medium',
        confidence: 0.75,
        actionable: true,
        basedOn: ['completionRate'],
        estimatedImpact: '+20% de progresso',
      });
    }

    return recommendations;
  }

  private analyzeEnergyLevels(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze executed text length as proxy for energy
    const avgExecutedLength = this.context.recentLogs.reduce(
      (sum, log) => sum + log.executed_text.length,
      0
    ) / Math.max(this.context.recentLogs.length, 1);

    if (avgExecutedLength < 50) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'energy_management',
        title: 'Gerenciar energia',
        description: 'Seus registros são curtos, possivelmente indicando baixa energia. Considere pausas mais frequentes.',
        priority: 'medium',
        confidence: 0.7,
        actionable: true,
        basedOn: ['executed_text_length'],
        estimatedImpact: '+15% de energia',
      });
    }

    if (avgExecutedLength > 500) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'break_reminder',
        title: 'Lembrar de pausas',
        description: 'Você está escrevendo muito! Ótimo sinal de produtividade, mas lembre-se de fazer pausas.',
        priority: 'low',
        confidence: 0.6,
        actionable: true,
        basedOn: ['executed_text_length'],
        estimatedImpact: 'Prevenção de burnout',
      });
    }

    return recommendations;
  }

  private analyzeFocusAreas(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze recurring keywords in executed tasks
    const allExecuted = this.context.recentLogs.map(log => log.executed_text.toLowerCase()).join(' ');
    const keywords = ['programação', 'desenvolvimento', 'design', 'marketing', 'vendas', 'estudo', 'aprendizado', 'exercício', 'saúde', 'família', 'leitura', 'escrita'];
    
    const keywordCounts = keywords.map(keyword => ({
      keyword,
      count: (allExecuted.match(new RegExp(keyword, 'g')) || []).length,
    }));

    const topKeywords = keywordCounts
      .filter(k => k.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    if (topKeywords.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'focus_area',
        title: `Focar em ${topKeywords[0].keyword}`,
        description: `Você tem dedicado mais tempo a ${topKeywords[0].keyword}. Considere estruturar metas específicas nesta área.`,
        priority: 'medium',
        confidence: 0.8,
        actionable: true,
        basedOn: ['executed_keywords'],
        estimatedImpact: '+30% de especialização',
      });
    }

    return recommendations;
  }

  private analyzeSentiment(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (this.context.sentimentTrend === 'declining') {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'energy_management',
        title: 'Revisar bem-estar',
        description: 'Seu sentimento geral está em declínio. Considere adicion atividades que te fazem feliz.',
        priority: 'high',
        confidence: 0.75,
        actionable: true,
        basedOn: ['sentimentTrend'],
        estimatedImpact: '+40% de bem-estar',
      });
    }

    if (this.context.sentimentTrend === 'improving') {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'routine_optimization',
        title: 'Manter momento',
        description: 'Seu sentimento está melhorando! Continue com as práticas atuais que estão funcionando.',
        priority: 'low',
        confidence: 0.7,
        actionable: true,
        basedOn: ['sentimentTrend'],
        estimatedImpact: 'Sustentabilidade',
      });
    }

    return recommendations;
  }

  private analyzeStreak(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (this.context.currentStreak === 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'task_suggestion',
        title: 'Recomeçar streak',
        description: 'Seu streak foi interrompido. Comece com uma tarefa simples para recuperar o ritmo.',
        priority: 'high',
        confidence: 0.9,
        actionable: true,
        basedOn: ['currentStreak'],
        estimatedImpact: 'Início de novo streak',
      });
    }

    if (this.context.currentStreak >= 7) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'goal_adjustment',
        title: 'Celebrar streak',
        description: `Incrível! Você tem ${this.context.currentStreak} dias consecutivos. Considere celebrar esta conquista.`,
        priority: 'low',
        confidence: 0.85,
        actionable: true,
        basedOn: ['currentStreak'],
        estimatedImpact: 'Motivação sustentada',
      });
    }

    if (this.context.currentStreak >= 21) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'goal_adjustment',
        title: 'Estabelecer hábito sólido',
        description: 'Com 21+ dias, você formou um hábito sólido. Considere expandir sua rotina.',
        priority: 'medium',
        confidence: 0.9,
        actionable: true,
        basedOn: ['currentStreak'],
        estimatedImpact: 'Hábito consolidado',
      });
    }

    return recommendations;
  }

  private analyzeProjects(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (this.context.activeProjects > 5) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'focus_area',
        title: 'Reduzir projetos ativos',
        description: 'Você tem muitos projetos ativos. Considere focar em 2-3 projetos principais.',
        priority: 'high',
        confidence: 0.8,
        actionable: true,
        basedOn: ['activeProjects'],
        estimatedImpact: '+50% de foco',
      });
    }

    if (this.context.activeProjects === 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'task_suggestion',
        title: 'Iniciar novo projeto',
        description: 'Você não tem projetos ativos. Comece um projeto para direcionar seu foco.',
        priority: 'medium',
        confidence: 0.75,
        actionable: true,
        basedOn: ['activeProjects'],
        estimatedImpact: 'Direção clara',
      });
    }

    if (this.context.completedProjects > 0 && this.context.activeProjects === 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'goal_adjustment',
        title: 'Planejar próximo projeto',
        description: 'Você completou projetos recentemente. Ótimo momento para planejar o próximo.',
        priority: 'medium',
        confidence: 0.8,
        actionable: true,
        basedOn: ['completedProjects', 'activeProjects'],
        estimatedImpact: 'Continuidade de progresso',
      });
    }

    return recommendations;
  }

  getRecommendations(): Recommendation[] {
    return this.recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getRecommendationsByType(type: RecommendationType): Recommendation[] {
    return this.recommendations.filter(r => r.type === type);
  }

  getHighPriorityRecommendations(): Recommendation[] {
    return this.recommendations.filter(r => r.priority === 'high');
  }

  dismissRecommendation(id: string) {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
  }
}

export function generateRecommendations(context: UserContext): Recommendation[] {
  const ai = new LocalAIRecommendations(context);
  return ai.getRecommendations();
}

export type { Recommendation, RecommendationType, UserContext };