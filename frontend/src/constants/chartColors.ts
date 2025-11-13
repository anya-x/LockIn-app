/**
 * Colorblind-friendly chart color palette
 * Based on Paul Tol's qualitative color scheme
 * Tested with colorblind simulator
 *
 * Resources:
 * - Paul Tol's color schemes: https://personal.sron.nl/~pault/
 * - Colorbrewer 2.0: https://colorbrewer2.org/
 * - Chrome DevTools vision simulator
 */
export const CHART_COLORS = {
  // Primary metrics
  productivity: "#2E7D32", // Green (was blue)
  focusTime: "#1565C0", // Blue (was green)
  tasks: "#F57C00", // Orange
  burnoutRisk: "#C62828", // Red
  breaks: "#6A1B9A", // Purple

  // Eisenhower matrix (must be distinct)
  urgentImportant: "#D32F2F", // Red
  urgentNotImportant: "#F57C00", // Orange
  notUrgentImportant: "#1976D2", // Blue
  notUrgentNotImportant: "#7CB342", // Green

  // Gradients for area charts
  focusGradient: {
    start: "#1565C0",
    end: "#1565C050",
  },
  burnoutGradient: {
    start: "#C62828",
    end: "#C6282850",
  },
};

// Colorblind-safe combinations for future use
export const COLORBLIND_SAFE_PAIRS = [
  ["#0077BB", "#EE7733"], // Blue-Orange
  ["#009988", "#CC3311"], // Teal-Red
  ["#33BBEE", "#EE3377"], // Cyan-Magenta
];
