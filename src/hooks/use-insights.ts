import { useMemo } from "react";
import { useDailyLogs } from "./use-daily-logs";
import { useProfile } from "./use-profile";

export type Insight = {
  id: string;
  title: string;
  description: string;
  type: "achievement" | "improvement" | "pattern" | "suggestion";
  severity: "low" | "medium" | "high";
  actionable: boolean;
  icon: string;
};

export type Pattern = {
  category: string;
  description: string;
  data: any;
  trend: "increasing" | "decreasing" | "stable";
};

export function useInsights() {
  const { logs } = useDailyLogs();
  const { profile } = useProfile();

  const insights = useMemo((): Insight[] => {
    const generatedInsights: Insight[] = [];

    if (logs.length === 0) {
      return [{
        id: "first_step",
        title: "Comece sua jornada",
        description: "Registre seu primeiro dia para começar a receber insights personalizados.",
        type: "suggestion",
        severity: "medium",
        actionable: true,
        icon: "🎯",
      }];
    }

    // Consistency insight
    const consistencyRate = logs.filter(log => log.summary_text.length > 0).length / logs.length;
    if (consistencyRate > 0.8) {
      generatedInsights.push({
        id: "high_consistency",
        title: "Excelente consistência",
        description: `Você está mantendo ${(consistencyRate * 100).toFixed(0)}% de consistência nos resumos. Continue assim!`,
        type: "achievement",
        severity: "low",
        actionable: false,
        icon: "🏆",
      });
    } else if (consistencyRate < 0.5 && consistencyRate > 0) {
      generatedInsights.push({
        id: "low_consistency",
        title: "Melhore a consistência",
        description: `Sua consistência está em ${(consistencyRate * 100).toFixed(0)}%. Tente aumentar a frequência dos resumos.`,
        type: "improvement",
        severity: "medium",
        actionable: true,
        icon: "📈",
      });
    }

    // Productivity pattern
    const recentLogs = logs.slice(0, 7);
    const avgExecutedLength = recentLogs.reduce((sum, log) => sum + log.executed_text.length, 0) / recentLogs.length;
    if (avgExecutedLength > 200) {
      generatedInsights.push({
        id: "high_productivity",
        title: "Produtividade em alta",
        description: "Você tem mantido um nível alto de produtividade nos últimos dias.",
        type: "achievement",
        severity: "low",
        actionable: false,
        icon: "🚀",
      });
    }

    // Goal completion pattern
    const avgPlannedItems = logs.reduce((sum, log) => sum + log.planned_text.split('\n').filter(line => line.trim()).length, 0) / logs.length;
    if (avgPlannedItems > 5) {
      generatedInsights.push({
        id: "goal_setter",
        title: "Definidor de metas",
        description: `Você planeja em média ${avgPlannedItems.toFixed(1)} tarefas por dia. Isso é ótimo!`,
        type: "achievement",
        severity: "low",
        actionable: false,
        icon: "🎯",
      });
    }

    // Time pattern analysis
    const weekdays = new Array(7).fill(0);
    logs.forEach(log => {
      const date = new Date(log.log_date);
      weekdays[date.getDay()] += log.executed_text.length;
    });
    const mostProductiveDay = weekdays.indexOf(Math.max(...weekdays));
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    if (mostProductiveDay !== -1 && weekdays[mostProductiveDay] > 0) {
      generatedInsights.push({
        id: "productivity_pattern",
        title: "Padrão de produtividade",
        description: `Seu dia mais produtivo é ${dayNames[mostProductiveDay]}. Planeje suas tarefas mais importantes para esse dia.`,
        type: "pattern",
        severity: "low",
        actionable: true,
        icon: "📊",
      });
    }

    // Streak analysis
    let currentStreak = 0;
    let maxStreak = 0;
    const sortedLogs = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    
    for (let i = 0; i < sortedLogs.length; i++) {
      if (i > 0) {
        const prevDate = new Date(sortedLogs[i - 1].log_date);
        const currDate = new Date(sortedLogs[i].log_date);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);

    if (maxStreak >= 7) {
      generatedInsights.push({
        id: "streak_achievement",
        title: "Streak impressionante",
        description: `Você alcançou um streak de ${maxStreak} dias consecutivos. Isso demonstra grande disciplina!`,
        type: "achievement",
        severity: "low",
        actionable: false,
        icon: "🔥",
      });
    }

    // Age-based insights
    if (profile?.birth_date) {
      const age = calculateAge(profile.birth_date);
      if (age >= 25 && age < 30) {
        generatedInsights.push({
          id: "life_phase_career",
          title: "Fase de construção",
          description: "Você está na fase ideal para construir sua carreira. Foque em projetos de longo prazo.",
          type: "suggestion",
          severity: "medium",
          actionable: true,
          icon: "🏗️",
        });
      } else if (age >= 30 && age < 40) {
        generatedInsights.push({
          id: "life_phase_leadership",
          title: "Fase de liderança",
          description: "Ótimo momento para assumir posições de liderança e mentoria.",
          type: "suggestion",
          severity: "medium",
          actionable: true,
          icon: "👥",
        });
      }
    }

    return generatedInsights;
  }, [logs, profile]);

  const patterns = useMemo((): Pattern[] => {
    const patterns: Pattern[] = [];

    if (logs.length < 7) return patterns;

    // Weekly pattern
    const weeklyData = logs.slice(0, 7).map(log => ({
      date: log.log_date,
      productivity: log.executed_text.length,
      planned: log.planned_text.split('\n').filter(line => line.trim()).length,
      completed: log.executed_text.split('\n').filter(line => line.trim()).length,
    }));

    const avgProductivity = weeklyData.reduce((sum, d) => sum + d.productivity, 0) / weeklyData.length;
    const avgPlanned = weeklyData.reduce((sum, d) => sum + d.planned, 0) / weeklyData.length;
    const avgCompleted = weeklyData.reduce((sum, d) => sum + d.completed, 0) / weeklyData.length;

    patterns.push({
      category: "Produtividade Semanal",
      description: `Média de ${avgProductivity.toFixed(0)} caracteres por dia`,
      data: { avgProductivity, avgPlanned, avgCompleted },
      trend: avgProductivity > 150 ? "increasing" : "stable",
    });

    // Goal completion rate
    const completionRate = avgPlanned > 0 ? (avgCompleted / avgPlanned) * 100 : 0;
    patterns.push({
      category: "Taxa de Conclusão",
      description: `${completionRate.toFixed(0)}% das tarefas planejadas são executadas`,
      data: { completionRate },
      trend: completionRate > 70 ? "increasing" : completionRate < 50 ? "decreasing" : "stable",
    });

    return patterns;
  }, [logs]);

  return {
    insights,
    patterns,
    hasInsights: insights.length > 0,
  };
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}