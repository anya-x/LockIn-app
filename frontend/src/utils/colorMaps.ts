/**
 * Reusable color mapping utilities for consistent theming across the application.
 * Consolidates duplicate color mapping logic from multiple components.
 */

/**
 * Maps task status to MUI color variants.
 * Used for status chips and indicators.
 */
export const getStatusColor = (
  status: string
): "default" | "primary" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case "TODO":
      return "default";
    case "IN_PROGRESS":
      return "primary";
    case "COMPLETED":
      return "success";
    default:
      return "default";
  }
};

/**
 * Maps goal type to MUI color variants.
 * Used for goal type indicators.
 */
export const getGoalTypeColor = (
  type: string
): "default" | "primary" | "secondary" | "info" | "success" => {
  switch (type) {
    case "DAILY":
      return "info";
    case "WEEKLY":
      return "primary";
    case "MONTHLY":
      return "secondary";
    default:
      return "default";
  }
};

/**
 * Maps session type to color hex codes.
 * Used for timer chips and session indicators.
 *
 * @param sessionType - Type of focus session
 * @param profileColor - Custom color for WORK sessions
 * @returns Hex color string
 */
export const getSessionTypeColor = (
  sessionType: string,
  profileColor: string = "#1976d2"
): string => {
  switch (sessionType) {
    case "WORK":
      return profileColor;
    case "SHORT_BREAK":
      return "#2e7d32"; // Green for short breaks
    case "LONG_BREAK":
      return "#7b1fa2"; // Purple for long breaks
    default:
      return "#1976d2"; // Default blue
  }
};

/**
 * Calculates Eisenhower Matrix priority level for sorting.
 * Higher number = higher priority.
 *
 * @param isUrgent - Whether task is time-sensitive
 * @param isImportant - Whether task contributes to goals
 * @returns Priority level (1-4)
 */
export const getPriorityLevel = (
  isUrgent: boolean,
  isImportant: boolean
): number => {
  if (isUrgent && isImportant) return 4; // Do First
  if (isUrgent) return 3; // Delegate
  if (isImportant) return 2; // Schedule
  return 1; // Eliminate
};
