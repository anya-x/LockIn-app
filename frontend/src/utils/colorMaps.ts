/**
 * Theme-aware color utilities for LockIn app
 *
 * These colors adapt to light/dark mode for proper contrast and aesthetics.
 * Based on Tailwind CSS color palette for consistency.
 */

// Semantic status colors - adapt to theme mode
export const STATUS_COLORS = {
  light: {
    TODO: { main: "#64748B", bg: "rgba(100, 116, 139, 0.1)" },
    IN_PROGRESS: { main: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
    COMPLETED: { main: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
    ARCHIVED: { main: "#9CA3AF", bg: "rgba(156, 163, 175, 0.1)" },
  },
  dark: {
    TODO: { main: "#94A3B8", bg: "rgba(148, 163, 184, 0.15)" },
    IN_PROGRESS: { main: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)" },
    COMPLETED: { main: "#34D399", bg: "rgba(52, 211, 153, 0.15)" },
    ARCHIVED: { main: "#6B7280", bg: "rgba(107, 114, 128, 0.15)" },
  },
} as const;

// Eisenhower Matrix quadrant colors
export const QUADRANT_COLORS = {
  light: {
    doFirst: { main: "#EF4444", bg: "rgba(239, 68, 68, 0.08)", border: "#EF4444" },
    schedule: { main: "#3B82F6", bg: "rgba(59, 130, 246, 0.08)", border: "#3B82F6" },
    delegate: { main: "#F59E0B", bg: "rgba(245, 158, 11, 0.08)", border: "#F59E0B" },
    eliminate: { main: "#8B5CF6", bg: "rgba(139, 92, 246, 0.08)", border: "#8B5CF6" },
  },
  dark: {
    doFirst: { main: "#F87171", bg: "rgba(248, 113, 113, 0.12)", border: "#F87171" },
    schedule: { main: "#60A5FA", bg: "rgba(96, 165, 250, 0.12)", border: "#60A5FA" },
    delegate: { main: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "#FBBF24" },
    eliminate: { main: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", border: "#A78BFA" },
  },
} as const;

// Priority colors for filters (matches quadrant semantics)
export const PRIORITY_COLORS = {
  light: {
    all: "#64748B",
    "do-first": "#EF4444",
    schedule: "#3B82F6",
    delegate: "#F59E0B",
    eliminate: "#64748B",
  },
  dark: {
    all: "#94A3B8",
    "do-first": "#F87171",
    schedule: "#60A5FA",
    delegate: "#FBBF24",
    eliminate: "#94A3B8",
  },
} as const;

// Timer/Pomodoro session colors
export const SESSION_COLORS = {
  light: {
    WORK: "#6366F1",      // Indigo - focused work
    SHORT_BREAK: "#10B981", // Green - refresh
    LONG_BREAK: "#8B5CF6",  // Purple - reward
  },
  dark: {
    WORK: "#818CF8",
    SHORT_BREAK: "#34D399",
    LONG_BREAK: "#A78BFA",
  },
} as const;

// Category color palette - optimized for both modes
// These are user-selectable, so we pick colors that work reasonably in both modes
export const CATEGORY_PALETTE = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#64748B", // Slate
  "#78716C", // Stone
];

// Helper to get theme-aware status color
export const getStatusColor = (
  status: string,
  mode: "light" | "dark" = "light"
): { main: string; bg: string } => {
  const colors = STATUS_COLORS[mode];
  return colors[status as keyof typeof colors] || colors.TODO;
};

// Helper to get MUI color prop for chips/badges
export const getStatusChipColor = (
  status: string
): "default" | "primary" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case "TODO":
      return "default";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
    case "ARCHIVED":
      return "default";
    default:
      return "default";
  }
};

// Helper to get quadrant colors
export const getQuadrantColor = (
  quadrant: "doFirst" | "schedule" | "delegate" | "eliminate",
  mode: "light" | "dark" = "light"
) => {
  return QUADRANT_COLORS[mode][quadrant];
};

// Helper to get priority filter color
export const getPriorityColor = (
  priority: string,
  mode: "light" | "dark" = "light"
): string => {
  const colors = PRIORITY_COLORS[mode];
  return colors[priority as keyof typeof colors] || colors.all;
};

// Helper to get session type color
export const getSessionTypeColor = (
  sessionType: string,
  profileColor: string = "#6366F1",
  mode: "light" | "dark" = "light"
): string => {
  if (sessionType === "WORK") {
    return profileColor; // Use user's profile color for work sessions
  }
  const colors = SESSION_COLORS[mode];
  return colors[sessionType as keyof typeof colors] || profileColor;
};

// Calculate priority level (for sorting)
export const getPriorityLevel = (
  isUrgent: boolean,
  isImportant: boolean
): number => {
  if (isUrgent && isImportant) return 4; // Do First
  if (isImportant) return 3;              // Schedule
  if (isUrgent) return 2;                 // Delegate
  return 1;                                // Eliminate
};

// Goal type colors
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

// Utility to adjust color opacity for backgrounds
export const withOpacity = (color: string, opacity: number): string => {
  // Handle hex colors
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};
