import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsService, type Analytics, type StreakStats } from "../services/analyticsService";

export function useTodayAnalytics() {
  return useQuery({
    queryKey: ["analytics", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      await analyticsService.calculateForDate(today);

      return await analyticsService.getTodayAnalytics();
    },
    staleTime: 3600000,
  });
}

export function useAnalyticsRange(days: number = 7) {
  return useQuery({
    queryKey: ["analytics", "range", days],
    queryFn: () => analyticsService.getAnalyticsRange(days),
    staleTime: 3600000,
  });
}

export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return async () => {
    await analyticsService.refreshCache();
    await queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}

export function useComparisonAnalytics(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      "analytics",
      "compare",
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    ],
    queryFn: () =>
      analyticsService.comparePeriods({
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
      }),
    enabled,
    staleTime: 3600000,
  });
}

export interface ProductivityInsightsData {
  totalDaysAnalyzed: number;
  mostProductiveDay: string;
  bestTimeOfDay: string;
  averageSessionLength: number;
  completionRateTrend: number;
}

export function useProductivityInsights() {
  const { data: rangeData } = useAnalyticsRange(30); // Last 30 days for insights

  return useQuery({
    queryKey: ["analytics", "insights", rangeData?.length],
    queryFn: (): ProductivityInsightsData => {
      if (!rangeData || rangeData.length === 0) {
        return {
          totalDaysAnalyzed: 0,
          mostProductiveDay: "MONDAY",
          bestTimeOfDay: "morning",
          averageSessionLength: 0,
          completionRateTrend: 0,
        };
      }

      // Calculate most productive day of week
      const dayScores: { [key: string]: { total: number; count: number } } = {};
      const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

      rangeData.forEach((day) => {
        const date = new Date(day.date);
        const dayName = daysOfWeek[date.getDay()];
        if (!dayScores[dayName]) {
          dayScores[dayName] = { total: 0, count: 0 };
        }
        dayScores[dayName].total += day.productivityScore;
        dayScores[dayName].count += 1;
      });

      const mostProductiveDay = Object.entries(dayScores).reduce((best, [day, scores]) => {
        const avg = scores.total / scores.count;
        const bestAvg = dayScores[best].total / dayScores[best].count;
        return avg > bestAvg ? day : best;
      }, Object.keys(dayScores)[0] || "MONDAY");

      // Calculate best time of day
      const timeScores = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      };

      rangeData.forEach((day) => {
        timeScores.morning += day.morningFocusMinutes || 0;
        timeScores.afternoon += day.afternoonFocusMinutes || 0;
        timeScores.evening += day.eveningFocusMinutes || 0;
        timeScores.night += day.nightFocusMinutes || 0;
      });

      const bestTimeOfDay = Object.entries(timeScores).reduce((best, [time, minutes]) =>
        minutes > timeScores[best as keyof typeof timeScores] ? time : best
      , "morning");

      // Calculate average session length
      const totalPomodoros = rangeData.reduce((sum, day) => sum + day.pomodorosCompleted, 0);
      const totalMinutes = rangeData.reduce((sum, day) => sum + day.focusMinutes, 0);
      const averageSessionLength = totalPomodoros > 0 ? Math.round(totalMinutes / totalPomodoros) : 0;

      // Calculate completion rate trend (last 7 days vs previous 7 days)
      const recentDays = rangeData.slice(-7);
      const previousDays = rangeData.slice(-14, -7);

      const recentRate = recentDays.length > 0
        ? recentDays.reduce((sum, day) => sum + day.completionRate, 0) / recentDays.length
        : 0;
      const previousRate = previousDays.length > 0
        ? previousDays.reduce((sum, day) => sum + day.completionRate, 0) / previousDays.length
        : 0;

      const completionRateTrend = recentRate - previousRate;

      return {
        totalDaysAnalyzed: rangeData.length,
        mostProductiveDay,
        bestTimeOfDay,
        averageSessionLength,
        completionRateTrend,
      };
    },
    enabled: !!rangeData && rangeData.length > 0,
    staleTime: 3600000,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ["analytics", "streak"],
    queryFn: () => analyticsService.getStreak(),
    staleTime: 60000, // 1 minute - streak can change frequently
  });
}

export interface TaskVelocity {
  current: number; // 7-day moving average
  previous: number; // Previous 7-day average
  change: number; // Percentage change
  trend: "up" | "down" | "stable";
}

export function useTaskVelocity() {
  const { data: rangeData } = useAnalyticsRange(14); // Last 14 days

  return useQuery({
    queryKey: ["analytics", "velocity", rangeData?.length],
    queryFn: (): TaskVelocity => {
      if (!rangeData || rangeData.length < 7) {
        return {
          current: 0,
          previous: 0,
          change: 0,
          trend: "stable",
        };
      }

      // Calculate 7-day moving averages
      const recentDays = rangeData.slice(-7);
      const previousDays = rangeData.slice(-14, -7);

      const currentAvg = recentDays.reduce((sum, day) => sum + day.tasksCompleted, 0) / recentDays.length;
      const previousAvg = previousDays.length > 0
        ? previousDays.reduce((sum, day) => sum + day.tasksCompleted, 0) / previousDays.length
        : 0;

      const change = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (Math.abs(change) >= 5) {
        trend = change > 0 ? "up" : "down";
      }

      return {
        current: Number(currentAvg.toFixed(1)),
        previous: Number(previousAvg.toFixed(1)),
        change: Number(change.toFixed(1)),
        trend,
      };
    },
    enabled: !!rangeData && rangeData.length >= 7,
    staleTime: 3600000,
  });
}
