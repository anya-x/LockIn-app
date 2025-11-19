import type { Analytics } from "../services/analyticsService";

/**
 * Aggregated statistics calculated from analytics data.
 */
export interface AggregatedStats {
  /** Total number of completed pomodoro sessions */
  totalSessions: number;
  /** Average productivity score across the period */
  avgProductivity: number;
  /** Total number of completed tasks */
  totalTasks: number;
  /** Total focus minutes across all sessions */
  totalFocusMinutes: number;
}

/**
 * Calculates aggregated statistics from a collection of daily analytics.
 *
 * This function computes summary metrics across multiple days of analytics data,
 * providing insights into overall productivity, focus time, and task completion.
 *
 * @param analytics - Array of daily analytics data to aggregate
 * @returns Aggregated statistics including totals and averages
 *
 * @example
 * ```typescript
 * const weeklyAnalytics = [...]; // 7 days of analytics
 * const stats = calculateStats(weeklyAnalytics);
 * console.log(`Total focus: ${stats.totalFocusMinutes} minutes`);
 * console.log(`Avg productivity: ${stats.avgProductivity.toFixed(1)}%`);
 * ```
 */
export const calculateStats = (analytics: Analytics[]): AggregatedStats => {
  const totalSessions = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );

  const avgProductivity =
    analytics.length > 0
      ? analytics.reduce((sum, day) => sum + day.productivityScore, 0) /
        analytics.length
      : 0;

  const stats: AggregatedStats = {
    totalSessions,
    avgProductivity,
    totalTasks: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
    totalFocusMinutes: analytics.reduce(
      (sum, day) => sum + day.focusMinutes,
      0
    ),
  };

  return stats;
};

/**
 * Trend direction indicator for metric comparisons.
 */
export type TrendDirection = "up" | "down" | "stable";

/**
 * Determines the trend direction by comparing current and previous metrics.
 *
 * Uses a 5% threshold to distinguish between meaningful changes and stable trends:
 * - "up": Current value is >5% higher than previous
 * - "down": Current value is >5% lower than previous
 * - "stable": Change is within ±5%
 *
 * @param current - The current metric value
 * @param previous - The previous metric value to compare against
 * @returns Trend direction: "up", "down", or "stable"
 *
 * @example
 * ```typescript
 * getTrendDirection(105, 100); // "stable" (5% change)
 * getTrendDirection(110, 100); // "up" (10% increase)
 * getTrendDirection(90, 100);  // "down" (10% decrease)
 * ```
 */
export const getTrendDirection = (
  current: number,
  previous: number
): TrendDirection => {
  if (current > previous * 1.05) return "up";
  if (current < previous * 0.95) return "down";
  return "stable";
};
