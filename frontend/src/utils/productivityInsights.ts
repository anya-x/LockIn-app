// Productivity Insights - Statistical analysis of user data

export interface ProductivityInsights {
  mostProductiveDay: string;
  bestTimeOfDay: string;
  averageSessionLength: number;
  completionRateTrend: string;
  focusStreak: number;
  recommendations: string[];
}

export const calculateProductivityInsights = (
  analytics: any[]
): ProductivityInsights => {
  if (!analytics || analytics.length === 0) {
    return {
      mostProductiveDay: "Not enough data",
      bestTimeOfDay: "Not enough data",
      averageSessionLength: 0,
      completionRateTrend: "stable",
      focusStreak: 0,
      recommendations: ["Start tracking your productivity to get insights!"],
    };
  }

  // Find most productive day of week
  const dayScores: { [key: string]: number[] } = {};
  analytics.forEach((day) => {
    const dayOfWeek = new Date(day.date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = [];
    dayScores[dayOfWeek].push(day.productivityScore);
  });

  const avgByDay = Object.entries(dayScores).map(([day, scores]) => ({
    day,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const mostProductiveDay =
    avgByDay.length > 0
      ? avgByDay.sort((a, b) => b.avg - a.avg)[0].day
      : "Unknown";

  // Find best time of day
  let totalMorning = 0,
    totalAfternoon = 0,
    totalEvening = 0,
    totalNight = 0;

  analytics.forEach((day) => {
    totalMorning += day.morningFocusMinutes || 0;
    totalAfternoon += day.afternoonFocusMinutes || 0;
    totalEvening += day.eveningFocusMinutes || 0;
    totalNight += day.nightFocusMinutes || 0;
  });

  const timeOfDay = [
    { name: "Morning", minutes: totalMorning },
    { name: "Afternoon", minutes: totalAfternoon },
    { name: "Evening", minutes: totalEvening },
    { name: "Night", minutes: totalNight },
  ];

  const bestTimeOfDay =
    timeOfDay.length > 0
      ? timeOfDay.sort((a, b) => b.minutes - a.minutes)[0].name
      : "Unknown";

  // Calculate average session length
  const totalPomodoros = analytics.reduce(
    (sum, day) => sum + day.pomodorosCompleted,
    0
  );
  const totalMinutes = analytics.reduce(
    (sum, day) => sum + day.focusMinutes,
    0
  );
  const averageSessionLength =
    totalPomodoros > 0 ? Math.round(totalMinutes / totalPomodoros) : 0;

  // Completion rate trend
  const recentDays = analytics.slice(-7);
  const olderDays = analytics.slice(-14, -7);

  const recentAvg =
    recentDays.reduce((sum, day) => sum + day.completionRate, 0) /
    recentDays.length;
  const olderAvg =
    olderDays.length > 0
      ? olderDays.reduce((sum, day) => sum + day.completionRate, 0) /
        olderDays.length
      : recentAvg;

  const completionRateTrend =
    recentAvg > olderAvg * 1.05
      ? "improving"
      : recentAvg < olderAvg * 0.95
      ? "declining"
      : "stable";

  // Focus streak (consecutive days with > 0 focus)
  let focusStreak = 0;
  for (let i = analytics.length - 1; i >= 0; i--) {
    if (analytics[i].focusMinutes > 0) {
      focusStreak++;
    } else {
      break;
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (totalMorning > totalAfternoon && totalMorning > totalEvening) {
    recommendations.push(
      "You're most productive in the morning - schedule important tasks then!"
    );
  }

  if (completionRateTrend === "declining") {
    recommendations.push(
      "Your task completion rate is declining. Consider breaking tasks into smaller chunks."
    );
  }

  if (averageSessionLength < 20) {
    recommendations.push(
      "Your average session is quite short. Try longer focus sessions for deeper work."
    );
  }

  if (focusStreak > 7) {
    recommendations.push(
      `Great job! You've maintained a ${focusStreak}-day focus streak!`
    );
  }

  const avgBurnout =
    analytics.reduce((sum, day) => sum + day.burnoutRiskScore, 0) /
    analytics.length;
  if (avgBurnout > 60) {
    recommendations.push(
      "Your burnout risk is elevated. Make sure to take breaks and maintain work-life balance."
    );
  }

  return {
    mostProductiveDay,
    bestTimeOfDay,
    averageSessionLength,
    completionRateTrend,
    focusStreak,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Keep up the great work!"],
  };
};
