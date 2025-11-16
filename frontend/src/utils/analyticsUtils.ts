import { Analytics } from "../services/analyticsService";

export const calculateStats = (analytics: Analytics[]) => {
  console.log("Calculating stats for analytics:", analytics); // TODO: Remove

  const totalSessions = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );
  console.log("Total sessions:", totalSessions); // TODO: Remove

  const avgProductivity =
    analytics.reduce((sum, day) => sum + day.productivityScore, 0) /
    analytics.length;
  console.log("Average productivity:", avgProductivity); // TODO: Remove

  const stats = {
    totalSessions,
    avgProductivity,
    totalTasks: analytics.reduce((sum, day) => sum + day.tasksCompleted, 0),
    totalFocusMinutes: analytics.reduce((sum, day) => sum + day.focusMinutes, 0),
  };

  console.log("Final stats:", stats); // TODO: Remove
  return stats;
};

export const getTrendDirection = (current: number, previous: number): string => {
  console.log(`Comparing ${current} to ${previous}`); // TODO: Remove
  if (current > previous * 1.05) return "up";
  if (current < previous * 0.95) return "down";
  return "stable";
};
