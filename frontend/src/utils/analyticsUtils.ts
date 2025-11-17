import type { Analytics } from "../services/analyticsService";

export const calculateStats = (analytics: Analytics[]) => {
  const totalSessions = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );

  const avgProductivity =
    analytics.reduce((sum, day) => sum + day.productivityScore, 0) /
    analytics.length;

  const stats = {
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

export const getTrendDirection = (
  current: number,
  previous: number
): string => {
  if (current > previous * 1.05) return "up";
  if (current < previous * 0.95) return "down";
  return "stable";
};
