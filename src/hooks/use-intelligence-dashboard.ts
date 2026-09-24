import { useMemo } from "react";
import { useDailyLogs } from "./use-daily-logs";
import { useProfile } from "./use-profile";
import { analyzeSentiment, getSentimentTrend } from "@/lib/sentiment-analysis";
import { generateRecommendations, type UserContext } from "@/lib/ai-recommendations";
import { predictNextWeek, getProductivityInsights, type ProductivityData } from "@/lib/productivity-prediction";
import { localAnalytics } from "@/lib/local-analytics";

export function useIntelligenceDashboard() {
  const { logs } = useDailyLogs();
  const { profile } = useProfile();

  const dashboardData = useMemo(() => {
    // Prepare productivity data for prediction
    const productivityData: ProductivityData[] = logs.map(log => ({
      date: log.log_date,
      productivity: log.executed_text.length,
      tasksCompleted: log.executed_text.split('\n').filter(line => line.trim()).length,
      sentiment: analyzeSentiment(log.summary_text).score,
      energy: log.executed_text.length > 100 ? 1 : 0.5,
    }));

    // Get predictions
    const predictions = predictNextWeek(productivityData);
    const productivityInsights = getProductivityInsights(productivityData);

    // Get sentiment analysis
    const sentimentData = logs.map(log => ({
      date: log.log_date,
      sentiment: analyzeSentiment(log.summary_text),
    }));
    const sentimentTrend = getSentimentTrend(sentimentData.map(s => s.sentiment));

    // Get AI recommendations
    const userContext: UserContext = {
      recentLogs: logs.slice(-7),
      currentStreak: logs.length > 0 ? 1 : 0, // Simplificado
      avgProductivity: productivityData.length > 0 
        ? productivityData.reduce((sum, d) => sum + d.productivity, 0) / productivityData.length 
        : 0,
      mostProductiveDay: 1, // Simplificado
      completionRate: productivityData.length > 0 
        ? productivityData.reduce((sum, d) => sum + d.tasksCompleted, 0) / (productivityData.length * 5) 
        : 0,
      sentimentTrend,
      activeProjects: 0, // Simplificado
      completedProjects: 0,
      lastActivity: logs.length > 0 ? logs[0].log_date : '',
    };

    const recommendations = generateRecommendations(userContext);

    // Get analytics
    const analytics = localAnalytics.getAnalytics();

    return {
      predictions,
      productivityInsights,
      sentimentData,
      sentimentTrend,
      recommendations,
      analytics,
      userContext,
    };
  }, [logs, profile]);

  return dashboardData;
}