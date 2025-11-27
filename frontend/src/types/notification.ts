/**
 * Notification type constants.
 * Must match backend NotificationType.java
 */
export const NotificationType = {
  // AI Features
  AI_BREAKDOWN: "AI_BREAKDOWN",
  DAILY_BRIEFING: "DAILY_BRIEFING",
  AI_ENHANCEMENT: "AI_ENHANCEMENT",

  // Calendar
  CALENDAR_SYNC: "CALENDAR_SYNC",
  CALENDAR_CONNECTED: "CALENDAR_CONNECTED",

  // Task Reminders
  TASK_DUE: "TASK_DUE",
  TASK_OVERDUE: "TASK_OVERDUE",
  TASK_COMPLETED: "TASK_COMPLETED",

  // System
  SYSTEM: "SYSTEM",
  WELCOME: "WELCOME",
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

/**
 * Get display name for notification type.
 */
export function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case NotificationType.AI_BREAKDOWN:
      return "AI Task Breakdown";
    case NotificationType.DAILY_BRIEFING:
      return "Daily Briefing";
    case NotificationType.AI_ENHANCEMENT:
      return "AI Enhancement";
    case NotificationType.CALENDAR_SYNC:
      return "Calendar Sync";
    case NotificationType.CALENDAR_CONNECTED:
      return "Calendar Connected";
    case NotificationType.TASK_DUE:
      return "Task Due";
    case NotificationType.TASK_OVERDUE:
      return "Task Overdue";
    case NotificationType.TASK_COMPLETED:
      return "Task Completed";
    case NotificationType.SYSTEM:
      return "System";
    case NotificationType.WELCOME:
      return "Welcome";
    default:
      return "Notification";
  }
}

/**
 * Check if notification type is AI-related.
 */
export function isAINotification(type: string): boolean {
  const aiTypes: string[] = [
    NotificationType.AI_BREAKDOWN,
    NotificationType.DAILY_BRIEFING,
    NotificationType.AI_ENHANCEMENT,
  ];
  return aiTypes.includes(type);
}

/**
 * Check if notification type is calendar-related.
 */
export function isCalendarNotification(type: string): boolean {
  const calendarTypes: string[] = [
    NotificationType.CALENDAR_SYNC,
    NotificationType.CALENDAR_CONNECTED,
  ];
  return calendarTypes.includes(type);
}

/**
 * Check if notification type is task-related.
 */
export function isTaskNotification(type: string): boolean {
  const taskTypes: string[] = [
    NotificationType.TASK_DUE,
    NotificationType.TASK_OVERDUE,
    NotificationType.TASK_COMPLETED,
  ];
  return taskTypes.includes(type);
}
