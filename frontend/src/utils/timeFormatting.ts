/**
 * Reusable time formatting utilities for consistent time display.
 * Consolidates duplicate time formatting logic from multiple components.
 */

/**
 * Formats minutes into human-readable hours and minutes.
 *
 * @param minutes - Total minutes to format
 * @returns Formatted string like "2h 30m" or "45m"
 *
 * @example
 * formatTime(150) // "2h 30m"
 * formatTime(45)  // "45m"
 * formatTime(0)   // "0m"
 */
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Formats seconds into MM:SS countdown format.
 *
 * @param seconds - Total seconds to format
 * @returns Formatted string like "05:30" or "120:00"
 *
 * @example
 * formatCountdown(330) // "05:30"
 * formatCountdown(45)  // "00:45"
 */
export const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Standard date format configurations for consistent date display.
 */
export const DateFormats = {
  /**
   * Short date: "Dec 25, 2024"
   */
  SHORT: {
    month: "short" as const,
    day: "numeric" as const,
    year: "numeric" as const,
  },

  /**
   * Short date without year: "Dec 25"
   */
  SHORT_NO_YEAR: {
    month: "short" as const,
    day: "numeric" as const,
  },

  /**
   * Full datetime: "12/25/2024, 02:30 PM"
   */
  FULL: {
    day: "2-digit" as const,
    month: "2-digit" as const,
    year: "numeric" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },

  /**
   * Numeric date: "12/25/2024"
   */
  NUMERIC: {
    day: "2-digit" as const,
    month: "2-digit" as const,
    year: "numeric" as const,
  },
} as const;

/**
 * Formats a date using predefined format configurations.
 *
 * @param date - Date string or Date object
 * @param format - Format configuration from DateFormats
 * @param locale - Locale string (defaults to "en-US")
 * @returns Formatted date string
 *
 * @example
 * formatDate("2024-12-25", DateFormats.SHORT) // "Dec 25, 2024"
 * formatDate(new Date(), DateFormats.SHORT_NO_YEAR) // "Dec 25"
 */
export const formatDate = (
  date: string | Date,
  format: (typeof DateFormats)[keyof typeof DateFormats],
  locale: string = "en-US"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, format);
};
