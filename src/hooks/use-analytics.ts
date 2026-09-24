import { useMemo } from "react";
import { useDailyLogs } from "./use-daily-logs";
import { useProjects } from "./use-projects";
import { useMilestones } from "./use-milestones";

export type AnalyticsData = {
  productivity: {
    daily: Array<{ date: string; planned: number; executed: number; summary: number }>;
    weekly: Array<{ week: string; productivity: number }>;
    monthly: Array<{ month: string; productivity: number }>;
  };
  patterns: {
    bestDay: string;
    mostProductiveHour: number;
    consistency: number;
    averageDailyGoals: number;
  };
  projects: {
    completed: number;
    inProgress: number;
    averageCompletionTime: number;
  };
  milestones: {
    total: number;
    byCategory: Record<string, number>;
    yearlyTrend: Array<{ year: string; count: number }>;
  };
};

export function useAnalytics() {
  const { logs } = useDailyLogs();
  const { projects } = useProjects();
  const { milestones } = useMilestones();

  const analytics = useMemo((): AnalyticsData => {
    // Productivity Analytics
    const dailyProductivity = logs.map(log => ({
      date: log.log_date,
      planned: log.planned_text.length,
      executed: log.executed_text.length,
      summary: log.summary_text.length,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Weekly productivity
    const weeklyProductivity = [];
    const weeklyMap = new Map<string, number>();
    
    dailyProductivity.forEach(({ date, executed }) => {
      const weekKey = getWeekKey(date);
      const current = weeklyMap.get(weekKey) || 0;
      weeklyMap.set(weekKey, current + executed);
    });

    weeklyMap.forEach((productivity, week) => {
      weeklyProductivity.push({ week, productivity });
    });

    // Monthly productivity
    const monthlyProductivity = [];
    const monthlyMap = new Map<string, number>();
    
    dailyProductivity.forEach(({ date, executed }) => {
      const monthKey = date.substring(0, 7); // YYYY-MM
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + executed);
    });

    monthlyMap.forEach((productivity, month) => {
      monthlyProductivity.push({ month, productivity });
    });

    // Patterns Analysis
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayProductivity = new Map<number, number>();
    
    logs.forEach(log => {
      const date = new Date(log.log_date);
      const day = date.getDay();
      const productivity = log.executed_text.length;
      dayProductivity.set(day, (dayProductivity.get(day) || 0) + productivity);
    });

    let bestDayIndex = 0;
    let maxProductivity = 0;
    dayProductivity.forEach((prod, day) => {
      if (prod > maxProductivity) {
        maxProductivity = prod;
        bestDayIndex = day;
      }
    });

    const consistency = logs.length > 0 
      ? (logs.filter(log => log.summary_text.length > 0).length / logs.length) * 100 
      : 0;

    const averageDailyGoals = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.planned_text.split('\n').filter(line => line.trim()).length, 0) / logs.length
      : 0;

    // Projects Analytics
    const completedProjects = projects.filter(p => p.status === 'Concluído').length;
    const inProgressProjects = projects.filter(p => p.status === 'Em andamento').length;
    const averageCompletionTime = 30; // Mock value - would need real data

    // Milestones Analytics
    const categoryCount = new Map<string, number>();
    milestones.forEach(m => {
      categoryCount.set(m.category, (categoryCount.get(m.category) || 0) + 1);
    });

    const byCategory: Record<string, number> = {};
    categoryCount.forEach((count, category) => {
      byCategory[category] = count;
    });

    const yearlyTrend = new Map<string, number>();
    milestones.forEach(m => {
      const year = m.year;
      yearlyTrend.set(year, (yearlyTrend.get(year) || 0) + 1);
    });

    const yearlyTrendArray = [];
    yearlyTrend.forEach((count, year) => {
      yearlyTrendArray.push({ year, count });
    });

    return {
      productivity: {
        daily: dailyProductivity,
        weekly: weeklyProductivity.sort((a, b) => a.week.localeCompare(b.week)),
        monthly: monthlyProductivity.sort((a, b) => a.month.localeCompare(b.month)),
      },
      patterns: {
        bestDay: dayNames[bestDayIndex],
        mostProductiveHour: 10, // Mock value
        consistency: Math.round(consistency),
        averageDailyGoals: Math.round(averageDailyGoals),
      },
      projects: {
        completed: completedProjects,
        inProgress: inProgressProjects,
        averageCompletionTime,
      },
      milestones: {
        total: milestones.length,
        byCategory,
        yearlyTrend: yearlyTrendArray.sort((a, b) => a.year.localeCompare(b.year)),
      },
    };
  }, [logs, projects, milestones]);

  return analytics;
}

function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}