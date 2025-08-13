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

export const getSessionTypeColor = (
  sessionType: string,
  profileColor: string = "#1976d2"
): string => {
  switch (sessionType) {
    case "WORK":
      return profileColor;
    case "SHORT_BREAK":
      return "#2e7d32";
    case "LONG_BREAK":
      return "#7b1fa2";
    default:
      return "#1976d2";
  }
};

export const getPriorityLevel = (
  isUrgent: boolean,
  isImportant: boolean
): number => {
  if (isUrgent && isImportant) return 4;
  if (isUrgent) return 3;
  if (isImportant) return 2;
  return 1;
};
