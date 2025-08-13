export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const DateFormats = {
  SHORT: {
    month: "short" as const,
    day: "numeric" as const,
    year: "numeric" as const,
  },

  SHORT_NO_YEAR: {
    month: "short" as const,
    day: "numeric" as const,
  },

  FULL: {
    day: "2-digit" as const,
    month: "2-digit" as const,
    year: "numeric" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },

  NUMERIC: {
    day: "2-digit" as const,
    month: "2-digit" as const,
    year: "numeric" as const,
  },
} as const;

export const formatDate = (
  date: string | Date,
  format: (typeof DateFormats)[keyof typeof DateFormats],
  locale: string = "fr-FR"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, format);
};
