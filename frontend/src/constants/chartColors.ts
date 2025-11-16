// Colorblind-friendly palette based on accessibility research
export const CHART_COLORS = {
  productivity: "#2E7D32", // Green
  focusTime: "#1565C0", // Blue
  tasks: "#F57C00", // Orange
  burnoutRisk: "#C62828", // Red
  breaks: "#6A1B9A", // Purple

  // Eisenhower matrix quadrants
  urgentImportant: "#D32F2F", // Red
  urgentNotImportant: "#F57C00", // Orange
  notUrgentImportant: "#1976D2", // Blue
  notUrgentNotImportant: "#7CB342", // Green
};

// Chart configuration
export const CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
    tooltip: {
      enabled: true,
      mode: "index" as const,
      intersect: false,
    },
  },
};
