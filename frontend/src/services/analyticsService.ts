import api from "./api";

export interface Analytics {
  date: string; // LocalDate from backend

  tasksCreated: number;
  tasksCompleted: number;
  completionRate: number;

  pomodorosCompleted: number;
  focusMinutes: number;
  breakMinutes: number;
  interruptedSessions: number;

  productivityScore: number;
  focusScore: number;
  burnoutRiskScore: number;

  lateNightSessions: number;
  overworkMinutes: number;
  consecutiveWorkDays: number;

  urgentImportantCount: number;
  notUrgentImportantCount: number;
  urgentNotImportantCount: number;
  notUrgentNotImportantCount: number;
}

export const analyticsService = {
  getTodayAnalytics: async (): Promise<Analytics> => {
    const response = await api.get<Analytics>("/analytics/today");
    return response.data;
  },

  getAnalyticsRange: async (days: number): Promise<Analytics[]> => {
    const response = await api.get<Analytics[]>("/analytics/range", {
      params: { days },
    });
    return response.data;
  },

  calculateForDate: async (date: string): Promise<Analytics> => {
    const response = await api.post<Analytics>(`/analytics/calculate/${date}`);
    return response.data;
  },
};
