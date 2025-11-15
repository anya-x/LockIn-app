export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  targetTasks?: number;
  targetPomodoros?: number;
  targetFocusMinutes?: number;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "productive_week",
    title: "Productive Week",
    description: "Complete a solid week of productivity",
    type: "WEEKLY",
    targetTasks: 30,
    targetPomodoros: 40,
    targetFocusMinutes: 600, // 10 hours
  },
  {
    id: "focus_month",
    title: "Focus Month",
    description: "Maintain high focus throughout the month",
    type: "MONTHLY",
    targetPomodoros: 100,
    targetFocusMinutes: 2000, // ~33 hours
  },
  {
    id: "balanced_day",
    title: "Balanced Day",
    description: "A balanced, productive day",
    type: "DAILY",
    targetTasks: 5,
    targetPomodoros: 8,
    targetFocusMinutes: 180, // 3 hours with custom profiles
  },
  {
    id: "deep_work_week",
    title: "Deep Work Week",
    description: "Intense focus week",
    type: "WEEKLY",
    targetPomodoros: 60,
    targetFocusMinutes: 1200, // 20 hours
  },
];
