import type { Analytics } from "../services/analyticsService";

export const calculateStats = (analytics: Analytics[]) => {
  console.log("calculating stats for analytics:", analytics);

  const totalSessions = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );
  console.log("total sessions:", totalSessions);

  const avgProductivity =
    analytics.reduce((sum, day) => sum + day.productivityScore, 0) /
    analytics.length;
  console.log("average productivity:", avgProductivity);

  const stats = {
    totalSessions,
    avgProductivity,
    totalTasks: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
    totalFocusMinutes: analytics.reduce(
      (sum, day) => sum + day.focusMinutes,
      0
    ),
  };

  console.log("final stats:", stats);
  return stats;
};

export const getTrendDirection = (
  current: number,
  previous: number
): string => {
  console.log(`comparing ${current} to ${previous}`);
  if (current > previous * 1.05) return "up";
  if (current < previous * 0.95) return "down";
  return "stable";
};
