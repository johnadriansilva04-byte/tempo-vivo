import { useMemo } from "react";
import { useDailyLogs } from "./use-daily-logs";
import { useMilestones } from "./use-milestones";
import { useProjects } from "./use-projects";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  streakHistory: Array<{ date: string; streak: number }>;
};

export type GamificationData = {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  achievements: Achievement[];
  streak: StreakData;
  badges: Array<{ id: string; name: string; icon: string; earned: boolean }>;
};

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_log',
    title: 'Primeiro Passo',
    description: 'Registre seu primeiro dia',
    icon: '🎯',
    rarity: 'common',
    maxProgress: 1,
  },
  {
    id: 'week_streak',
    title: 'Semana Perfeita',
    description: 'Mantenha um streak de 7 dias',
    icon: '🔥',
    rarity: 'rare',
    maxProgress: 7,
  },
  {
    id: 'month_streak',
    title: 'Mês Implacável',
    description: 'Mantenha um streak de 30 dias',
    icon: '⚡',
    rarity: 'epic',
    maxProgress: 30,
  },
  {
    id: 'century_club',
    title: 'Clube dos 100',
    description: 'Registre 100 dias',
    icon: '💯',
    rarity: 'epic',
    maxProgress: 100,
  },
  {
    id: 'consistency_master',
    title: 'Mestre da Consistência',
    description: 'Alcance 80% de consistência',
    icon: '🏆',
    rarity: 'rare',
    maxProgress: 80,
  },
  {
    id: 'goal_setter',
    title: 'Definidor de Metas',
    description: 'Complete 50 metas planejadas',
    icon: '🎯',
    rarity: 'common',
    maxProgress: 50,
  },
  {
    id: 'reflector',
    title: 'Reflexivo',
    description: 'Escreva resumos em 50 dias',
    icon: '📝',
    rarity: 'common',
    maxProgress: 50,
  },
  {
    id: 'project_master',
    title: 'Mestre de Projetos',
    description: 'Complete 10 projetos',
    icon: '🚀',
    rarity: 'rare',
    maxProgress: 10,
  },
  {
    id: 'milestone_collector',
    title: 'Colecionador de Marcos',
    description: 'Registre 20 marcos',
    icon: '⭐',
    rarity: 'rare',
    maxProgress: 20,
  },
  {
    id: 'year_warrior',
    title: 'Guerreiro do Ano',
    description: 'Mantenha um streak de 365 dias',
    icon: '👑',
    rarity: 'legendary',
    maxProgress: 365,
  },
];

const BADGES = [
  { id: 'early_bird', name: 'Madrugador', icon: '🌅' },
  { id: 'night_owl', name: 'Noturno', icon: '🦉' },
  { id: 'weekend_warrior', name: 'Guerreiro de Fim de Semana', icon: '⚔️' },
  { id: 'productivity_guru', name: 'Guru da Produtividade', icon: '🧘' },
  { id: 'consistency_king', name: 'Rei da Consistência', icon: '👑' },
];

export function useGamification() {
  const { logs } = useDailyLogs();
  const { milestones } = useMilestones();
  const { projects } = useProjects();

  const gamification = useMemo((): GamificationData => {
    // Calculate streak
    const streakData = calculateStreak(logs);
    
    // Calculate XP and level
    const totalXP = calculateTotalXP(logs, milestones, projects, streakData);
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    const xpToNextLevel = level * level * 100 - totalXP;
    const currentXP = totalXP - (level - 1) * (level - 1) * 100;

    // Calculate achievements
    const achievements = calculateAchievements(logs, milestones, projects, streakData);

    // Calculate badges
    const badges = calculateBadges(logs);

    return {
      level,
      xp: currentXP,
      xpToNextLevel,
      totalXP,
      achievements,
      streak: streakData,
      badges,
    };
  }, [logs, milestones, projects]);

  return gamification;
}

function calculateStreak(logs: any[]): StreakData {
  if (logs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: null,
      streakHistory: [],
    };
  }

  const sortedLogs = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const today = new Date().toISOString().split('T')[0];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastLogDate = sortedLogs[sortedLogs.length - 1].log_date;
  const streakHistory: Array<{ date: string; streak: number }> = [];

  // Check if the most recent log is from today or yesterday
  const mostRecentDate = new Date(lastLogDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) {
    currentStreak = 1;
  }

  // Calculate streaks
  for (let i = sortedLogs.length - 1; i >= 0; i--) {
    const currentDate = new Date(sortedLogs[i].log_date);
    const nextDate = i > 0 ? new Date(sortedLogs[i - 1].log_date) : null;
    
    if (nextDate) {
      const daysBetween = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        tempStreak++;
      } else if (daysBetween > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak++;
    }

    streakHistory.push({
      date: sortedLogs[i].log_date,
      streak: tempStreak,
    });
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  currentStreak = Math.max(currentStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastLogDate,
    streakHistory: streakHistory.reverse(),
  };
}

function calculateTotalXP(logs: any[], milestones: any[], projects: any[], streak: StreakData): number {
  let xp = 0;

  // XP for logs
  xp += logs.length * 10; // 10 XP per log

  // XP for streaks
  xp += streak.currentStreak * 5; // 5 XP per streak day
  xp += streak.longestStreak * 3; // 3 XP per longest streak day

  // XP for milestones
  xp += milestones.length * 25; // 25 XP per milestone

  // XP for completed projects
  const completedProjects = projects.filter(p => p.status === 'Concluído').length;
  xp += completedProjects * 50; // 50 XP per completed project

  // XP for consistency
  const consistency = logs.length > 0 
    ? (logs.filter(log => log.summary_text.length > 0).length / logs.length) * 100 
    : 0;
  xp += Math.floor(consistency * 2); // 2 XP per consistency point

  return xp;
}

function calculateAchievements(logs: any[], milestones: any[], projects: any[], streak: StreakData): Achievement[] {
  return ACHIEVEMENTS.map(achievement => {
    let progress = 0;
    let unlocked = false;

    switch (achievement.id) {
      case 'first_log':
        progress = logs.length > 0 ? 1 : 0;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'week_streak':
        progress = streak.currentStreak;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'month_streak':
        progress = streak.currentStreak;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'century_club':
        progress = logs.length;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'consistency_master':
        const consistency = logs.length > 0 
          ? (logs.filter(log => log.summary_text.length > 0).length / logs.length) * 100 
          : 0;
        progress = Math.floor(consistency);
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'goal_setter':
        const totalGoals = logs.reduce((sum, log) => 
          sum + log.planned_text.split('\n').filter(line => line.trim()).length, 0);
        progress = totalGoals;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'reflector':
        const summaries = logs.filter(log => log.summary_text.length > 0).length;
        progress = summaries;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'project_master':
        const completedProjects = projects.filter(p => p.status === 'Concluído').length;
        progress = completedProjects;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'milestone_collector':
        progress = milestones.length;
        unlocked = progress >= achievement.maxProgress;
        break;
      case 'year_warrior':
        progress = streak.currentStreak;
        unlocked = progress >= achievement.maxProgress;
        break;
    }

    return {
      ...achievement,
      unlocked,
      progress,
      unlockedAt: unlocked ? new Date().toISOString() : undefined,
    };
  });
}

function calculateBadges(logs: any[]): Array<{ id: string; name: string; icon: string; earned: boolean }> {
  return BADGES.map(badge => {
    let earned = false;

    switch (badge.id) {
      case 'early_bird':
        // Check if user logs mostly in the morning
        const morningLogs = logs.filter(log => {
          const date = new Date(log.created_at);
          return date.getHours() >= 6 && date.getHours() < 12;
        });
        earned = morningLogs.length > 5 && morningLogs.length / logs.length > 0.5;
        break;
      case 'night_owl':
        // Check if user logs mostly at night
        const nightLogs = logs.filter(log => {
          const date = new Date(log.created_at);
          return date.getHours() >= 22 || date.getHours() < 6;
        });
        earned = nightLogs.length > 5 && nightLogs.length / logs.length > 0.5;
        break;
      case 'weekend_warrior':
        // Check if user logs consistently on weekends
        const weekendLogs = logs.filter(log => {
          const date = new Date(log.log_date);
          return date.getDay() === 0 || date.getDay() === 6;
        });
        earned = weekendLogs.length > 10;
        break;
      case 'productivity_guru':
        // Check if user has high productivity
        const avgProductivity = logs.length > 0 
          ? logs.reduce((sum, log) => sum + log.executed_text.length, 0) / logs.length 
          : 0;
        earned = avgProductivity > 200;
        break;
      case 'consistency_king':
        // Check if user has 90%+ consistency
        const consistency = logs.length > 0 
          ? (logs.filter(log => log.summary_text.length > 0).length / logs.length) * 100 
          : 0;
        earned = consistency >= 90;
        break;
    }

    return { ...badge, earned };
  });
}