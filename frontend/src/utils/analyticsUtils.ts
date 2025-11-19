import type { Analytics } from "../services/analyticsService";

/**
 * Calculate aggregate statistics from analytics data.
 *
 * @param analytics Array of daily analytics
 * @returns Aggregate stats (sessions, productivity, tasks, focus time)
 */
export const calculateStats = (analytics: Analytics[]) => {
  const totalSessions = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );

  const avgProductivity =
    analytics.reduce((sum, day) => sum + day.productivityScore, 0) /
    analytics.length;

  return {
    totalSessions,
    avgProductivity,
    totalTasks: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
    totalFocusMinutes: analytics.reduce(
      (sum, day) => sum + day.focusMinutes,
      0
    ),
  };
};

/**
 * Determine trend direction based on current vs previous values.
 *
 * @param current Current period value
 * @param previous Previous period value
 * @returns "up", "down", or "stable" (±5% threshold)
 */
export const getTrendDirection = (
  current: number,
  previous: number
): string => {
  if (current > previous * 1.05) return "up";
  if (current < previous * 0.95) return "down";
  return "stable";
};
